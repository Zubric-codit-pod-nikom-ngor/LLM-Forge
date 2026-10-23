import asyncio
import copy
import datetime
import json
import math
import os
import sys
import time
import huggingface_hub
from types import *
from typing import *
import transformers
import dataclasses
from collections.abc import Iterable
from huggingface_hub import ModelCard



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
    huggingface_hub.login(
        file.read(),
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


if __name__ == "__main__":
    main()

# print(parse_jsonified(
#     {
#         "object": "get_model_card",
#         "args": ["HuggingFaceTB/SmolLM2-135M"],
#         "kwargs": {}
#     }
# ))