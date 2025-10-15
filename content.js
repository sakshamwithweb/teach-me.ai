const loadingBtn = (handleBtnClick) => {
        const btn = document.getElementById("edu-ai");
        if (!btn) return;

        btn.removeEventListener("click", handleBtnClick);

        btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="22" height="22" style="display:block;margin:auto;">
  <circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none" stroke-dasharray="31.4 31.4">
    <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" from="0 25 25" to="360 25 25"/>
  </circle>
</svg>
    `;
};



const handleAfterUpload = () => { }

// send message to background.js, get the video done and come here..
const handleBtnClick = () => {
    // Start loading btn here
    loadingBtn(handleBtnClick)

    chrome.runtime.sendMessage({ isActive: true, url: window.location.href, name: "upload" }, function (response) {
        if (response.success) {
            alert("Done")
            // Stop loading btn and intigrate a btn or whatever to do further things..
            
        }
    });
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
        ourBtn.addEventListener("click", handleBtnClick)
    }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.isActive) {
        createBtn()
    }
})