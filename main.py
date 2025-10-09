from flask import Flask, request # in request from flask, we don't use () in .json
import requests # here in .json we use (): .json()
import os
from dotenv import load_dotenv
from flask_cors import cross_origin
import redis


load_dotenv()
app = Flask(__name__)
rds = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

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
            rds.set(task_id, video_no) # In future you may wanna add a expiry..
    return {"success": True}


# Verified
@app.route("/upload", methods=['POST'])
@cross_origin()
def upload():
    payload = dict(request.json)
    url = payload["url"]
    response = requests.post(
        "https://api.memories.ai/serve/api/v1/scraper_url",
        json={
            "video_urls": [url],
            "unique_id": "default",
            "callback_url": "https://unulcerous-unelating-andra.ngrok-free.dev/memories-callback",
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
@app.route("/is_parsed", methods=['POST']) # Since there is no callback that tells us the video is parsed, we will have to do polling (from extension)
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
