import json
from threading import Thread

import torch
from flask import Flask, request, Response
from flask_cors import CORS
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer

app = Flask(__name__)
CORS(app)

model_name = "meta-llama/Llama-2-7b-chat-hf"
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = AutoModelForCausalLM.from_pretrained(model_name, torch_dtype=torch.float16).to(device)
tokenizer = AutoTokenizer.from_pretrained(model_name)


def convert_to_llama_format(history: list):
    formatted_history = ""

    if len(history) == 0:
        return formatted_history

    for entry in history:
        role = entry.get("role", "")
        message = entry.get("message", "")
        if role == "user":
            formatted_history += f"User: {message}\n"
        elif role == "AI":
            formatted_history += f"assistant: {message}\n"
    return formatted_history


def create_llama_prompt(history: list, query: str, model_type: str):
    system_prompt = """You are a helpful assistant."""

    formatted_history = convert_to_llama_format(history)

    if model_type == "llama":
        b_inst, e_inst = "[INST]", "[/INST]"
        b_sys, e_sys = "<<SYS>>\n", "\n<</SYS>>\n\n"
        system_prompt = b_sys + system_prompt + e_sys
        instruction = f"Context: {formatted_history}\n\nUser: {query}"
        prompt_template = b_inst + system_prompt + instruction + e_inst
    elif model_type == "llama3":
        b_inst, e_inst = "user", ""
        b_sys, e_sys = "system ", ""
        assistant_inst = "assistant"
        system_prompt = b_sys + system_prompt + e_sys
        instruction = f"Context: {formatted_history}\nUser: {query}"
        prompt_template = system_prompt + b_inst + instruction + assistant_inst
    else:
        raise ValueError("Unsupported model type")

    return prompt_template


@app.route('/api/llama', methods=['POST'])
def handle_request():
    content_type = request.headers.get('Content-Type')

    if content_type == 'application/json':
        return handle_text_request()
    else:
        return Response("Unsupported Media Type", status=415)


def handle_text_request():
    data = request.json
    history = json.loads(data.get('message', '[]'))
    query = data.get('query', '')
    model_type = data.get('model_type', 'llama')

    if query == '':
        return Response("Missing query parameter", status=400)

    prompt = create_llama_prompt(history, query, model_type)

    print(f"Formatted prompt:\n{prompt}")

    def generate():
        inputs = tokenizer(prompt, return_tensors='pt').to(device)
        streamer = TextIteratorStreamer(tokenizer, skip_special_tokens=True)
        generation_kwargs = dict(inputs=inputs['input_ids'], streamer=streamer, max_length=8096)
        generation_thread = Thread(target=model.generate, kwargs=generation_kwargs)
        generation_thread.start()

        buffer = ""
        remove_prompt = True
        for new_text in streamer:
            buffer += new_text
            if remove_prompt:
                if "[/INST]" in buffer:
                    buffer = buffer.split("[/INST] ", 1)[1].strip()
                    remove_prompt = False
                else:
                    continue  # Skip until we find the end of the prompt

            yield buffer
            buffer = ""

    return Response(generate(), content_type='text/plain')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
