from flask import Flask, request
import requests
import os
from dotenv import load_dotenv
from flask_cors import cross_origin

load_dotenv()
app = Flask(__name__)
headers = {"Authorization": os.getenv("API_KEY")}


@app.route("/upload", methods=['POST'])
@cross_origin()
def upload():
    payload = dict(request.json)
    url = payload["url"]
    response = requests.post(
        "https://api.memories.ai/serve/api/v1/scraper_url",
        json={
            "video_urls": [url],
            "unique_id": "default"
        },
        headers=headers
    )
    taskId = (response.json())["data"]["taskId"]

    return {"success": True, "task_id": taskId}


@app.route("/task", methods=['POST'])
@cross_origin()
def task():
    payload = dict(request.json)
    task_id = payload["taskId"]
    response = requests.get(
        "https://api.memories.ai/serve/api/v1/get_video_ids_by_task_id",
        headers=headers,
        params={
            "task_id": task_id,
            "unique_id": "default"
        }
    )
    if ((response.json())["success"]):
        videos = (response.json())["data"]["videos"]
        return {"success": True, "videos": videos}
    else:
        return {"success": False}
