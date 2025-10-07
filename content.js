const createBtn = () => {
    const right_ctrls = document.getElementsByClassName("ytp-right-controls")[0]
    right_ctrls.innerHTML = `<button id="edu-ai" class="ytp-button">
    <svg width="90%" height="90%" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" fill="transparent" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif"
            font-size="14" fill="#fff" font-weight="bold">
            AI
        </text>
    </svg>
</button>` + right_ctrls.innerHTML

    const ourBtn = document.getElementById("edu-ai")
    ourBtn.addEventListener("click", () => {
        alert("Clicked")
    })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    createBtn()
})