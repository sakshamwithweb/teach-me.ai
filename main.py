from flask import Flask, request  # in request from flask, we don't use () in .json
import requests  # here in .json we use (): .json()
import os
from dotenv import load_dotenv
from flask_cors import cross_origin
import redis
from pymongo import MongoClient
from youtube_extractor import extract_video_id_from_url
import json
from parser import cmd_parse, parsed_cmd_to_browser_cmds
from lib.get_explaination_cmd import get_explaination_cmd
from json_repair import repair_json

load_dotenv()

app = Flask(__name__)

rds = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

mongo_client = MongoClient(os.getenv("MONGO_URI"))
mongo_db = mongo_client[os.getenv("MONGO_DB_NAME")]
video_collection = mongo_db["videos"]

headers = {"Authorization": os.getenv("API_KEY")}

# Verified
@app.route("/memories-callback", methods=["POST"])
@cross_origin()
def memories_callback():
    data = request.json
    if data['status'] == "SUCCEEDED":
        task_id = data['taskId']
        req = requests.get(  # Get videoNo
            "https://api.memories.ai/serve/api/v1/get_video_ids_by_task_id",
            headers=headers,
            params={"task_id": task_id}
        )
        res = req.json()
        if (res["success"]):
            video_no = res["data"]["videos"][0]["video_no"]
            video_id = extract_video_id_from_url(
                res["data"]["videos"][0]["video_url"])  # Store in DB
            video_collection.insert_one(
                {"video_id": video_id, "video_no": video_no})
            # In future you may wanna add a expiry..
            rds.set(task_id, video_no)
    return {"success": True}


# Verified
@app.route("/upload", methods=['POST'])
@cross_origin()
def upload():
    payload = dict(request.json)
    url = payload["url"]

    video_id = extract_video_id_from_url(url)
    video_exist_in_db = video_collection.find_one({"video_id": video_id})
    if video_exist_in_db:  # If video exist in db
        return {"success": True, "exist": True, "video_no": video_exist_in_db["video_no"]}
    print("CALLBACK URL:", os.getenv("CALLBACK"))
    response = requests.post(
        "https://api.memories.ai/serve/api/v1/scraper_url",
        json={
            "video_urls": [url],
            "unique_id": "default",
            "callback_url": os.getenv("CALLBACK"),
        },
        headers=headers
    )
    taskId = (response.json())["data"]["taskId"]

    return {"success": True, "task_id": taskId}


# Verified
@app.route("/task", methods=['POST'])
@cross_origin()
def task():
    payload = request.json
    task_id = payload["taskId"]
    # We can check the db if present so send video_no with success or else success is false..
    if rds.exists(task_id):
        video_no = rds.get(task_id)
        return {"success": True, "video_no": video_no}
    return {"success": False}


# Verified..
# Since there is no callback that tells us the video is parsed, we will have to do polling (from extension)
@app.route("/is_parsed", methods=['POST'])
@cross_origin()
def is_parsed():
    payload = dict(request.json)
    video_no = payload["videoNo"]
    response = requests.post(
        "https://api.memories.ai/serve/api/v1/list_videos",
        headers=headers,
        json={
            "video_no": video_no
        }
    )

    if ((response.json())["success"] and (response.json())["data"]["videos"][0]["status"] == "PARSE"):
        return {"success": True}
    else:
        return {"success": False}


@app.route("/user_question", methods=['POST'])
@cross_origin()
def user_question():
    # Get video_id, question and time in second and output questions.
    payload = dict(request.json)
    video_no = video_collection.find_one({"video_id": payload['videoId']})['video_no']
    question = payload["question"]
    time_in_sec = payload["timeInSec"]

    # Make questions for user based on time and question
    prompt = f"""I am making an edtech software that simulates like being a professor in zoom through an extension, when user watch any study related video and got any doubt, it presses a button exist in bottom right, then my AI reads whole video and explains to user. After user presses the btn, we ask for where the doubt is means time and what doubt. Now we know what user had doubt and where but suppose now I generate a general answer and give to user, what if one already knows many things what I have told, what if one feels very high level of what I am telling and need detailed info? For this reason, I need to know already what user knows and what user doesn't know. Based on timestamp and doubt user have, I want you to give me 1-3 questions that I will ask user to know level of understanding user currently possess relative to what doubt it has (So as to we can look at the answer user give and know how much he knows). Give an array just, **no Markdown or any extra text**. Remember, The question must be small and lightweight such that user feel it netural rather than a mini test.\nTime: {time_in_sec} sec\nQuestion: {question}"""
    
    req = requests.post(
        "https://api.memories.ai/serve/api/v1/chat",
        headers=headers,
        json={
            "video_nos": [video_no],
            "prompt": prompt
        },
        stream=False
    )
    questions = json.loads(req.json()["data"]["content"])
    session_id = req.json()["data"]["session_id"]

    return {"success": True, "questions": questions, "session_id": session_id}


@app.route("/user_answer", methods=['POST'])
@cross_origin()
def user_answer():
    payload = dict(request.json)
    # Got answers, questions, user_question, time and session_id.
    answers = payload["answers"]
    questions = payload["questions"]
    user_question = payload["userQuestion"]
    time = payload["time"]
    session_id = payload["session_id"] # I think it doesn't work (Can be working, need to check..)
    video_no = video_collection.find_one({"video_id": payload['videoId']})['video_no']

    # Now in tha same session, tell to ai that we asked these questions and got these answers so based on it, get the level of understanding user have and answer user's doubt through CMDs

    actions = {
        "<Say text=''>": "Speak to user",
        "<Pause>": "Pause video",
        "<Play>": "Play video",
        "<Mute>": "Mue video",
        "<Unmute>": "Unmute video"
    }

    llm_brokn_response = get_explaination_cmd(headers, video_no, questions, time, answers, user_question, actions)
    response = repair_json(llm_brokn_response)    
    raw_cmds = json.loads(response)["commands"]
    parsed_cmd = cmd_parse(raw_cmds) # Now we got actions we gotta do, lets convert those cmds to browser friendly cmds then send to client.
    browser_cmd = parsed_cmd_to_browser_cmds(parsed_cmd)

    return {"success": True, "browser_cmd": browser_cmd}

