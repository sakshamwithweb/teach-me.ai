from lark import Lark, Transformer

# Currently it is taking actions and their params with the rule of python like no string fight, but in future make it simple and your and parse it so as to llm can generate it very easily
grammar = r"""
start: value+

?value: "@" time "-" "<" function_name (param)* ">"

param: NAME "=" (STRING | QUOTED_STRING | NAME)

time: FLOAT

function_name: FUNCTION_NAME

FUNCTION_NAME: "Say" | "Pause" | "Play" | "Mute" | "Unmute"

%import common.CNAME -> NAME
%import common.FLOAT
%import common.ESCAPED_STRING -> QUOTED_STRING
STRING: /'[^']*'/     // single-quoted strings
%import common.WS
%ignore WS
"""


class CommandTransformer(Transformer):
    def time(self, items):
        return float(items[0])

    def function_name(self, items):
        return str(items[0])

    def param(self, items):
        key = str(items[0])
        value = items[1]
        
        if isinstance(value, str) and len(value) >= 2 and (
            (value.startswith("'") and value.endswith("'")) or
            (value.startswith('"') and value.endswith('"'))
        ):
            value = value[1:-1]
        return (key, value)

    def value(self, items):
        time = items[0]
        function = items[1]
        params = dict(items[2:]) if len(items) > 2 else {}
        return {
            "time": time,
            "function": function,
            "params": params
        }

    def start(self, items):
        return items


class Browser():
    def say(self, text):
        # Func to say..
        return f"window.speechSynthesis.speak(new SpeechSynthesisUtterance('{text}'));"
    
    def pause(self):
        # Pause YT video
        return "document.querySelector('video').pause();"
    
    def play(self):
        # Play the YT video
        return "document.querySelector('video').play();"
    
    def mute(self):
        # Mute the YT video
        return "document.getElementsByClassName('ytp-volume-icon')[0].click();"
    
    def unmute(self):
        # Unmute the YT video
        return "document.getElementsByClassName('ytp-volume-icon')[0].click();"



def cmd_parse(code):
    parser = Lark(grammar, start="start")
    transformer = CommandTransformer()
    tree = parser.parse(code)
    result = transformer.transform(tree)
    return result

def parsed_cmd_to_browser_cmds(parsed_cmd):
    # Make a pip module for converting youtube cmd to html code
    # _____TODO:Use time here, either teleport or whatever you want. Do it.. ___________
    browser = Browser()
    browser_cmds = []
    for cmd in parsed_cmd:
        func = getattr(browser, cmd["function"].lower())
        params = cmd["params"]

        result = func() if(len(params) == 0) else func(*list(params.values()))
        browser_cmds.append(result)
    return browser_cmds
