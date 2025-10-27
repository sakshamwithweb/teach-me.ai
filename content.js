
const startAIBtnLoading = (eventFunc) => { // Remove click event listener and start loading
    const btn = document.getElementById("edu-ai")
    btn.removeEventListener("click", eventFunc);
    btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="22" height="22" style="display:block;margin:auto;">
        <circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none" stroke-dasharray="31.4 31.4">
            <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" from="0 25 25" to="360 25 25"/>
        </circle>
    </svg>
    `
}

const stopAIBtnLoading = (eventFunc) => {
    const btn = document.getElementById("edu-ai")
    btn.innerHTML = `
    <svg width="90%" height="90%" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" fill="transparent" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#fff" font-weight="bold">
            AI
        </text>
    </svg>`
    btn.addEventListener("click", eventFunc)
}


const handleAskQuestion = async (questions, question, time, session_id) => { // Got questions, ask to user, get the answers and send back to server
    // Create a dialog like you created prev time where ask 1-3 questions, probably do map.
    const questionPanel = (question) => {
        // Create a dialog here where add question dynamically and return answer
        return new Promise((resolve) => {
            const dialogBox = document.createElement("div");
            dialogBox.classList.add("teach-me-ai-dialog");
            const p = document.createElement("p")
            p.innerText = question
            dialogBox.appendChild(p)
            const form = document.createElement("form")
            const input = document.createElement("input")
            form.append(input)
            const nextBtn = document.createElement("button")
            nextBtn.innerHTML = `&#8250;`
            nextBtn.style.borderRadius = "50%";
            form.append(nextBtn)


            const handleNextBtnClick = (value, dialogBox) => {
                // Take the answer, store somewhere and remove the dialog
                dialogBox.remove()
                resolve(value)
            }
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                handleNextBtnClick(input.value.trim(), dialogBox)
            });
            nextBtn.addEventListener("click", (e) => {
                e.preventDefault();
                handleNextBtnClick(input.value.trim(), dialogBox)
            });


            dialogBox.append(form)
            document.body.appendChild(dialogBox);
            input.focus();
        })
    }

    let answers = []
    for (const question of questions) {
        const answer = await questionPanel(question)
        answers.push(answer)
    }
    console.log("All questions are answered")
    console.log(answers)

    // Send the answer to the server
    chrome.runtime.sendMessage({ isActive: true, name: "userAnswerOfQuestion", answers: answers, questions: questions, userQuestion: question, time: time, session_id: session_id, url: window.location.href }, function (response) {
        // After answer is sent, we expect this in from server: Server will take: questions and their answers, user doubt and time. By this all generate cmds to teach to user :)
    });
}


const handleAskUserDoubt = () => { // Video is uploaded and ai btn is clicked means user wanna ask doubt, get the doubt and timestamp, send to server and get the questions.
    // show loading btn
    startAIBtnLoading(handleAskUserDoubt)

    // Create the dialog box
    const dialogBox = document.createElement("div");
    dialogBox.classList.add("teach-me-ai-dialog");

    const p = document.createElement("p")
    p.innerText = "In video, stay in the time of what you can't understand then click next"
    dialogBox.appendChild(p)
    const nextBtn = document.createElement("button")
    nextBtn.innerText = "Next"
    let time;
    nextBtn.addEventListener("click", () => {
        time = document.getElementsByClassName('video-stream')[0].currentTime
        // Go to next section where we ask its doubt
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
            // After Done btn is clicked, remove the dialog and send to server..
            dialogBox.remove()

            const question = input.value
            chrome.runtime.sendMessage({ isActive: true, url: window.location.href, question: question, time: time, name: "question" }, function (response) {
                const questions = response?.questions
                const session_id = response?.session_id // give this session id with user answer..
                // Got questions here, make a dialog like where ask questions to user then get the answer and send to server back
                handleAskQuestion(questions, question, time, session_id) // Also need question and time because later we will send it to server with answers
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
    dialogBox.appendChild(nextBtn)

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

}


const handleInitBtnClick = () => { // AI btn is clicked, now upload video
    // Start loading btn here
    const btn = document.getElementById("edu-ai");
    if (!btn) return;
    startAIBtnLoading(handleInitBtnClick)

    chrome.runtime.sendMessage({ isActive: true, url: window.location.href, name: "upload" }, function (response) {
        if (response.success) {
            // After video is uploaded, remove loading and add an ai btn, if clicked, call handleAskUserDoubt
            stopAIBtnLoading(handleAskUserDoubt)
        }
    });
}


const createInitBtn = () => { // AI btn is created at first
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