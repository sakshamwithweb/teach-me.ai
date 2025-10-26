// Make a btn, if clicked give option to select time or concept whcih user can't understand
const handleAfterUpload = () => {
    const btn = document.getElementById("edu-ai")
    btn.innerHTML = `<svg width="90%" height="90%" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" fill="transparent" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif"
            font-size="14" fill="#fff" font-weight="bold">
            AI
        </text>
    </svg>`
    btn.addEventListener("click", () => {
        // Disable btn click now.. (Have to dooooooooooooooooooo

        // In the side of video wherever we get place, show a dialog and ask to select time and then let user input its question then send to server.. 

        // Create the dialog box
        const dialogBox = document.createElement("div");
        dialogBox.classList.add("teach-me-ai-dialog");

        const p = document.createElement("p")
        p.innerText = "In video, stay in the time of what you can't understand then click next"
        dialogBox.appendChild(p)
        const btn = document.createElement("button")
        btn.innerText = "Next"
        let time;
        btn.addEventListener("click", () => {
            time = document.getElementsByClassName('video-stream')[0].currentTime
            // Go to next section where we et ser ask its qustion
            const label = document.createElement("label")
            label.setAttribute("for", "question")
            label.innerText = "Your Question:"
            const input = document.createElement("input")
            input.setAttribute("type", "text")
            input.setAttribute("id", "question")
            input.setAttribute("name", "question")
            const submitBtn = document.createElement("button")
            submitBtn.innerText = "Done"
            submitBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                // After Done btn is clicked, remove the dialog and show the loading again..

                const question = input.value

                chrome.runtime.sendMessage({ isActive: true, url: window.location.href, question: question, time: time, name: "question" }, function (response) {
                    const questions = response?.questions
                    // Got questions here, Now ask to user, get the answer and send to background.js then to server
                });
            })
            const form = document.createElement("form")
            form.appendChild(label)
            form.appendChild(input)
            form.appendChild(submitBtn)
            form.classList.add("teach-me-ai-dialog")
            dialogBox.innerHTML = ""
            dialogBox.appendChild(form)
        })
        dialogBox.appendChild(btn)

        document.body.appendChild(dialogBox);
        const style = document.createElement("style");
        style.innerHTML = `
.teach-me-ai-dialog button{
    padding: 8px;
    border-radius:7px;
    font:bold;
    cursor:pointer;
}

.teach-me-ai-dialog input{
    padding: 8px;
    border-radius: 5px;
}

.teach-me-ai-dialog {
    gap: 16px;
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: #fff;
    width: 50vw;
    height: 30vh;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-size: 16px;
    font-family: Arial, sans-serif;
    box-shadow: 0 4px 10px rgba(129, 95, 95, 0.5);
    display: flex;
    flex-direction:column;
    align-items: center;
    justify-content: center;
    text-align: center;
    animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
`;

        document.head.appendChild(style);
    })
}

const handleInitBtnClick = () => {
    // Start loading btn here
    const btn = document.getElementById("edu-ai");
    if (!btn) return;
    btn.removeEventListener("click", handleInitBtnClick);
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="22" height="22" style="display:block;margin:auto;">
  <circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none" stroke-dasharray="31.4 31.4">
    <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" from="0 25 25" to="360 25 25"/>
  </circle>
</svg>
    `;

    chrome.runtime.sendMessage({ isActive: true, url: window.location.href, name: "upload" }, function (response) {
        if (response.success) {
            // Stop loading btn and intigrate a btn or whatever to do further things..
            handleAfterUpload()
        }
    });
}

const createInitBtn = () => {
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
        ourBtn.addEventListener("click", handleInitBtnClick)
    }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.isActive) {
        createInitBtn()
    }
})