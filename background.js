const handleActiveTab = async (tabId) => {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url && tab.url.includes("youtube.com/watch")) {
        await chrome.tabs.sendMessage(tabId, { isActive: true });
    }
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
        console.log("Got task id")
        const taskId = res1.task_id
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

            if(res3.success){
                console.log("Parsed..") // In future, we may want to save url and videoNo in db to prevent duplicacy
                return
            }
            setTimeout(() => isParse(), 3000);
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
            if (res2?.success && res2.video_no) {
                console.log("Got video No")
                videoNo = res2.video_no
                // Check is it parsed?
                await isParse()
                return
            }
            setTimeout(() => getTask(), 3000);
        }
        getTask()
    }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.active && tab.url?.includes("youtube.com/watch")) {
        handleActiveTab(tabId);
    }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.isActive && msg?.name == "upload") {
        handleUploadVid(msg.url)
    }
})