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


def cmd_parse(code):
    parser = Lark(grammar, start="start")
    transformer = CommandTransformer()
    tree = parser.parse(code)
    result = transformer.transform(tree)
    return result