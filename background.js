const handleActiveTab = async (tabId) => {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url && tab.url.includes("youtube.com/watch")) {
        await chrome.tabs.sendMessage(tabId, { isActive: true });
    }
}


const videoUploaded = async (videoNo, url) => {
    const videoId = url.split("?")[1].split("&")[0].split("=")[1]
    await chrome.storage.session.set({ [videoId]: videoNo }) // Set the videoId and videoNo temporary in broser so as to if user stops or exit uknowingly so get it without going to backend
    return videoNo
}

const handleUploadVid = async (url) => {
    const serverUrl = "https://unulcerous-unelating-andra.ngrok-free.dev"
    console.log("Started")
    // Upload the video
    const req1 = await fetch(`${serverUrl}/upload`, { // It will initiate upload and give a task id
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
    })
    const res1 = await req1.json()
    if (res1?.success) {
        if (res1?.exist) {
            // Since it exist for a long time, I think it is parsed
            console.log("Video Exists")
            const videoNo = res1?.video_no
            videoUploaded(videoNo, url)
            return
        }
        const taskId = res1.task_id
        console.log("Got task id")
        let videoNo;

        const isParse = async () => {
            const req3 = await fetch(`${serverUrl}/is_parsed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ videoNo })
            })
            const res3 = await req3.json()

            if (res3.success) {
                console.log("Video parsed")
                videoUploaded(videoNo, url)
                return
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
            await isParse()
        }

        const getTask = async () => {
            const req2 = await fetch(`${serverUrl}/task`, { // It will take task id and when video will be uploaded then it will give video no.
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ taskId })
            })
            const res2 = await req2.json()
            console.log("Ran")
            if (res2?.success && res2.video_no) {
                videoNo = res2.video_no
                console.log("Got video no")
                // Check is it parsed?
                await isParse()
                return
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
            await getTask();
        }

        await getTask()
    }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.active && tab.url?.includes("youtube.com/watch")) {
        handleActiveTab(tabId);
    }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.isActive && msg?.name === "upload") {
        handleUploadVid(msg.url).then(() => {
            console.log("Video is ready")
            sendResponse({ success: true });
        })
        return true;
    }
});
