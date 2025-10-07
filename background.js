const handleActiveTab = async (tabId) => {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url && tab.url.includes("youtube.com/watch")) {
        await chrome.tabs.sendMessage(tabId, { msg: "YOUTUBE_ACTIVE" });
    }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.active && tab.url?.includes("youtube.com/watch")) {
        handleActiveTab(tabId);
    }
});