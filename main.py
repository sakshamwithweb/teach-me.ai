from flask import Flask, request
import requests
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
headers = {"Authorization": os.getenv("API_KEY")}


@app.route("/upload", methods=['POST'])
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
def task():
    payload = dict(request.json)
    taskId = payload["task_id"]
    response = requests.get(
        "https://api.memories.ai/serve/api/v1/get_video_ids_by_task_id",
        headers=headers,
        params={
            "task_id": taskId,
            "unique_id": "default"
        }
    )
    videos = (response.json())["data"]["videos"]
    return {"success": True, "videos": videos}
