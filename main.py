from flask import Flask, request  # in request from flask, we don't use () in .json
import requests  # here in .json we use (): .json()
import os
from dotenv import load_dotenv
from flask_cors import cross_origin
import redis
from pymongo import MongoClient
from youtube_extractor import extract_video_id_from_url

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
    if video_exist_in_db: # If video exist in db
        return {"success": True, "exist": True, "video_no": video_exist_in_db["video_no"]}

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
