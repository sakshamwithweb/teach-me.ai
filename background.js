const handleActiveTab = async (tabId) => {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url && tab.url.includes("youtube.com/watch")) {
        await chrome.tabs.sendMessage(tabId, { isActive: true });
    }
}

const handleUploadVid = async (url) => {
    const serverUrl = "http://127.0.0.1:5000"
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
        const taskId = res1.task_id
        const get_task = async () => {
            const req2 = await fetch(`${serverUrl}/task`, { // It will take task id and when video will be uploaded then it will give video no.
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ taskId })
            })
            const res2 = await req2.json()
            if (res2?.success && res2.videos.length > 0) {
                // Check is it parsed?
                console.log(res2.videos[0])
                return
            }
            setTimeout(() => get_task(), 5000);
        }
        get_task()
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