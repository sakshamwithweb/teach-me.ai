const handleBtnClick = ()=>{
    alert(window.location.href)
}

const createBtn = () => {
    const btnExists = document.getElementById("edu-ai")
    if (!btnExists) {
        const right_ctrls = document.getElementsByClassName("ytp-right-controls")[0]
        const btn = document.createElement("button")
        btn.classList.add("ytp-button")
        btn.setAttribute("id", "edu-ai")
        btn.innerHTML = `<svg width="90%" height="90%" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" fill="transparent" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif"
            font-size="14" fill="#fff" font-weight="bold">
            AI
        </text>
    </svg>`

        right_ctrls.insertBefore(btn, right_ctrls.firstChild)

        const ourBtn = document.getElementById("edu-ai")
        ourBtn.addEventListener("click", ()=>{handleBtnClick()})
    }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.isActive) {
        createBtn()
    }
})