import requests

def get_explaination_cmd(headers, video_no, questions, time, answers, user_question, actions):
    about_action_prompt = f"So, Determine the level of understanding user possess based on every input I have given to you. Now we gotta explain the answer of user doubt not only through text but like visually such that user feel as if it is not an ai but a professor at zoom call. Which is why I have made number of actions you will perform in the video where the doubt is, to explain the answer completely. Actions:\n{actions}\nSyntax: \"@time-<action params>\", time will be in seconds(can be in float) and action will be the one of the action we listed in actions dict. Leave a single space between every independant command(@time-<action params>) to distinguish. Please return with this format as raw json only. The value of the params of actions must be wrapped with escaped double quotes not single quote. OK here\'s a sample:\n {{\"user_knowledge\":\"Here talk about level of knowledge user possess based on all inputs I gave you\", \"commands\":\"Here just give the commands like @12.54-<Say text=\"So this is how it is\">\"}}"

    prompt = f"In previous chat I had said this: `I am making an edtech software that simulates like being a professor in zoom through an extension, when user watch any study related video and got any doubt, it presses a button exist in bottom right, then my AI reads whole video and explains to user. After user presses the btn, we ask for where the doubt is means time and what doubt. Now we know what user had doubt and where but suppose now I generate a general answer and give to user, what if one already knows many things what I have told, what if one feels very high level of what I am telling and need detailed info? For this reason, I need to know already what user knows and what user doesn\'t know. Based on timestamp and doubt user have, I wanted you to give me 1-3 questions that I would ask user to know level of understanding user possess relative to what doubt it has (So as to we can look at the answer user give and know how much he knows). Remember, The question must be small and lightweight such that user feel it netural rather than a mini test.\nTime: {time} sec\nQuestion: {user_question}`, you gave me these questions: {questions} and I asked to user and user gave these answers: {answers}\n\n{about_action_prompt}"

    req = requests.post(
        "https://api.memories.ai/serve/api/v1/chat",
        headers=headers,
        json={
            "video_nos": [video_no],
            "prompt": prompt
            # "session_id":session_id
        },
        stream=False
    )

    return req.json()["data"]["content"]