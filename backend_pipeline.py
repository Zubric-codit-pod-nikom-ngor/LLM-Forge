import asyncio
import copy
import datetime
import json
import math
import os
import pathlib
import sys
import time
import huggingface_hub
from types import *
from typing import *
import transformers
import dataclasses
from collections.abc import Iterable
from huggingface_hub import ModelCard
import tempfile
import torch



hf_api = huggingface_hub.HfApi()

settings: dict = None



def load_settings():
    with open("settings.json", "r") as file:
        global settings
        settings = json.load(file)
    return settings

def update_setting(path, value):
    settings[path] = value
    with open("settings.json", "w") as file:
        json.dump(settings, file, indent=4)
    return settings

def update_ui_setting(path, value):
    settings["UI"][path] = value
    with open("settings.json", "w") as file:
        json.dump(settings, file, indent=4)
    return settings



with open(".\\test_token", "r") as file:
    API_KEY = file.read()
    huggingface_hub.login(
        API_KEY,
        skip_if_logged_in=True
    )

def get_model_download_size(id):
    repo_info = hf_api.model_info(repo_id=id, files_metadata=True)

    total_bytes = 0
    for sibling in repo_info.siblings:
        if any(sibling.rfilename.endswith(ext) for ext in ['.safetensors', '.bin', '.pt', '.pth', '.gguf']):
            total_bytes += sibling.size or 0

    return list(map(lambda i: ord(i), parse_size(total_bytes*8)))

def search(query: str, limit=-1) -> Iterable[huggingface_hub.ModelInfo]:
    results = hf_api.list_models(
        search=query,
        filter="text-generation",
        sort="downloads",
        limit=None if limit == -1 else limit
    )
    return results

def get_model_card(id):
    val = str(ModelCard.load(id))
    val = val[3:][val[3:].find("---"):]
    return list(map(lambda i: ord(i), val))

def iterate_for(item: Iterable, amount: int = 1):
    result = []
    for i,el in enumerate(item):
        if i >= amount:
            break
        result.append(el)
    return result

def parse_size(item: int | float):
    if item == 0: return item+" Bits"
    namings = list("kmgtpezy".upper())
    byte_size = item/8
    if byte_size.is_integer(): byte_size = round(byte_size)
    else: byte_size = round(byte_size, 2)
    naming_iter = math.floor(math.log(byte_size, 1024))
    prefix = "" if (naming_iter == math.log(byte_size, 1024) or naming_iter == 0) \
        and byte_size == item//8 else "≈ "
    if naming_iter == 0 and math.floor(byte_size) > 0:
        return f"{prefix}{byte_size} Bytes"
    elif naming_iter == 0 and math.floor(byte_size) == 0:
        return f"{prefix}{item} Bits"
    elif naming_iter >= len(namings):
        return f"> 1024 YB"
    else:
        return f"{prefix}{round(item/(1024**naming_iter), 2)} {namings[naming_iter-1]}B"

def parse_amount(item: int | float):
    if item == 0: return item
    item = math.floor(item)
    namings = "K|Mil|Bil|Tril|Quad".split("|")
    thousands = item/1000
    by_namings = math.floor(math.log(thousands, 1000))
    if thousands < 1:
        return str(item)
    num_str = round(item/(1000**(by_namings+1)), 2)
    if num_str.is_integer(): num_str = round(num_str)
    return f"{str(num_str)} {namings[by_namings]}."

def to_jsonable(obj, _seen=None):
    if _seen is None:
        _seen = set()

    if obj is None or isinstance(obj, (str, int, float, bool)):
        return obj

    if isinstance(obj, (datetime.datetime, datetime.date, datetime.time)):
        return obj.isoformat()

    if isinstance(obj, dict):
        return {str(k): to_jsonable(v, _seen) for k, v in obj.items()}

    if isinstance(obj, (list, tuple, set, frozenset)):
        return [to_jsonable(v, _seen) for v in obj]

    if isinstance(obj, Iterable) and not isinstance(obj, (str, bytes, bytearray)):
        return [to_jsonable(v, _seen) for v in obj]

    oid = id(obj)
    if oid in _seen:
        return None

    _seen.add(oid)

    if dataclasses.is_dataclass(obj):
        data = {f.name: getattr(obj, f.name) for f in dataclasses.fields(obj)}
    elif hasattr(obj, "__dict__"):
        data = dict(vars(obj))
    else:
        data = {
            k: getattr(obj, k)
            for k in dir(obj)
            if not k.startswith("_")
        }

    return to_jsonable(data, _seen)

def jsonify(item):
    return json.dumps(to_jsonable(item), ensure_ascii=False)

def dejsonify(item: Any):
    return json.loads(item)

def parse_jsonified(item: dict):
    spawn_function = item["object"]
    positional_arguments = item["args"]
    keyword_arguments = item["kwargs"]
    result = globals()[spawn_function](*positional_arguments, **keyword_arguments)
    return result

def get_files(dir: str):
    comp = {}
    for file in os.scandir(dir):
        if not file.is_dir():
            with open(file.path, "r") as file_:
                conts = file_.read()
        comp[file.name] = {
            "isDir": file.is_dir(),
            "contents": None if file.is_dir() else conts
        }
    return comp

def main():

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            dejsonified = dejsonify(line)
            result = parse_jsonified(dejsonified)
            print(jsonify(result), flush=True)

        except Exception as exc:
            print(
                jsonify({
                    "error": str(exc),
                    "type": type(exc).__name__,
                }),
                flush=True,
            )


# if __name__ == "__main__":
#     main()


class MessageFields:

    class Roles:
        TOOL = "tool"
        SYSTEM = "system"
        USER = "user"
        ASSISTANT = "assistant"

    def generic_user_message(self, contents):
        return {
            "role": MessageFields.Roles.USER,
            "content": contents
        }

    def generic_context_setting_message(self, context):
        return {
            "role": MessageFields.Roles.SYSTEM,
            "content": context
        }

    def generic_raw_output_supply(self, output):
        return {
            "role": MessageFields.Roles.TOOL,
            "content": output
        }

    def generic_assistant_answer_response(self, responce):
        return {
            "role": MessageFields.Roles.ASSISTANT,
            "content": responce
        }


class InferenceChat:

    def __init__(self):
        self.messages = []
        self.name: str = None
        self.client: huggingface_hub.InferenceClient = None
        self.token_limits = 100

    def back_up(self):
        # TODO
        pass

    def file_up(self, message, stream: bool = False):
        self.messages.append(message)
        if stream:
            def wrapper():
                new_stream = self.client.chat.completions.create(
                    self.messages, stream=stream, model=self.client.model
                )

                for chunk in new_stream:
                    yield chunk

                print(new_stream)
                print(vars(new_stream))

            return wrapper()
        else:
            return self.client.chat.completions.create(
                self.messages, stream=stream, model=self.client.model
            )


class LoadedModel:

    def __init__(self, tokenizer, model, token_limits=100):
        self.tokenizer = tokenizer
        self.model = model
        self.messages = []
        self.name = ""
        self.token_limits = 100
        self.temperature = 1
        self.top_p = 0.9
        self.repetition_prenalty = 1.05
        self.chat_template = None

    def file_up(self, message, depth=0):
        self.messages.append(
            message
        )

        try:
            prompt = self.tokenizer.apply_chat_template(
                self.messages,
                tokenize=False,
                add_generation_prompt=True
            )
        except ValueError:
            if not self.tokenizer.chat_template:
                self.tokenizer.chat_template = """
{% for message in messages %}
  {% if message['role'] == 'user' %}
    {{ '<bos><user>' + message['content'].strip() + '<bot>' }}
  {% elif message['role'] == 'assistant' %}
    {{ message['content'].strip() + '<eos>' }}
  {% endif %}
{% endfor %}
""" if not self.chat_template else self.chat_template
            prompt = self.tokenizer.apply_chat_template(
                self.messages,
                tokenize=False,
                add_generation_prompt=True
            )

        inputs = self.tokenizer(
            [prompt], return_tensors="pt"
        ).to(self.model.device)

        if self.token_limits - inputs["input_ids"].shape[-1] <= 0:
            print(f"EXCEEDING DEPTH {depth}, DOUBLING TOKEN LIMITS TO {self.token_limits * 2}")
            self.token_limits *= 2
            self.messages.pop(-1)
            self.file_up(message, depth=depth + 1)

        try:
            with torch.no_grad():
                ids = self.model.generate(
                    **inputs,
                    max_new_tokens = self.token_limits - inputs["input_ids"].shape[-1],
                    temperature=self.temperature,
                    top_p=self.top_p, repetition_penalty=self.repetition_prenalty,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                )
        except IndexError:
            print(f"EXCEEDING DEPTH {depth}, DOUBLING TOKEN LIMITS TO {self.token_limits*2}")
            self.token_limits*=2
            self.messages.pop(-1)
            self.file_up(message, depth=depth+1)

        prompt_length = inputs.input_ids.shape[-1]
        response_tokens = ids[0][prompt_length:]

        response = self.tokenizer.decode(response_tokens, skip_special_tokens=True)

        self.messages.append(
            MessageFields().generic_assistant_answer_response(
                response
            )
        )

    def back_up(self):
        # TODO
        pass


def has_inference(id):
    model_info = hf_api.model_info(id)
    return True if model_info.transformers_info.pipeline_tag else False, model_info.transformers_info.pipeline_tag

def inference_client_creation(model_id):
    return huggingface_hub.InferenceClient(
        model_id, api_key=API_KEY
    )

def create_inference_chat(model_id, context=None, token_limits=100):
    new_chat = InferenceChat()
    new_chat.token_limits = token_limits
    new_chat.client = inference_client_creation(
        model_id
    )

    generic_message = MessageFields()
    if context:
        if type(context) != str:
            for piece in context:
                new_chat.file_up(generic_message.generic_context_setting_message(
                    piece
                ))
        else:
            new_chat.file_up(generic_message.generic_context_setting_message(
                context
            ))

    return new_chat

def download_hf_model(model_id, path):
    huggingface_hub.snapshot_download(
        repo_id=model_id, local_dir=path
    )

    loaded = load_downloaded_model(path)
    if not loaded.model.can_generate():
        os.rmdir(pathlib.Path(path).absolute())
        transformers.AutoModelForCausalLM.from_pretrained(
            model_id, cache_dir=path
        )

def load_downloaded_model(model_path):
    model_path = pathlib.Path(model_path)

    model = transformers.AutoModelForCausalLM.from_pretrained(model_path)

    tokenizer = transformers.AutoTokenizer.from_pretrained(
        model_path
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model.eval()

    return LoadedModel(
        model=model,
        tokenizer=tokenizer,
    )


# model_id = "Qwen/Qwen2.5-0.5B-Instruct"
# # download_hf_model(model_id, "./backed_up")
# model = load_downloaded_model("./backed_up")
# model.token_limits = 1024
#
# model.file_up(
#     MessageFields().generic_user_message(
#         "Hi! How's your day going?"
#     )
# )
#
# while True:
#     model.file_up(
#         MessageFields().generic_user_message(
#             input()
#         )
#     )