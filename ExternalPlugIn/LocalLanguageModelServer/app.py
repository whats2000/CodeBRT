import base64
import os
import time
import random

from flask import Flask, request, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

"""
This file use to simulate the external plugin server that can be used to test the Local Language Model Server.

You can run this file and test the Local Language Model Server with this server. 
Or you can use this file as a beginning to build your own local language model server.
"""

random_sentences = [
    "The quick brown fox jumps over the lazy dog.",
    "The five boxing wizards jump quickly.",
    "Pack my box with five dozen liquor jugs.",
    "How razorback-jumping frogs can level six piqued gymnasts!",
    "Cozy lummox gives smart squid who asks for job pen.",
    "The jay, pig, fox, zebra, and my wolves quack!",
    "Sympathizing would fix Quaker objectives.",
    "A wizard’s job is to vex chumps quickly in fog.",
    "Watch ‘Jeopardy!’, Alex Trebek’s fun TV quiz game.",
    "By Jove, my quick study of lexicography won a prize!",
    "Waltz, bad nymph, for quick jigs vex!",
    "Cwm fjord bank glyphs vext quiz."
]


@app.route('/api', methods=['POST'])
def api():
    print('API Request Received')
    return handle_request('message', 'image', '', include_query_in_history=True)


@app.route('/api2', methods=['POST'])
def api2():
    print('API2 Request Received')
    return handle_request('message', 'image', 'query', include_query_in_history=False)


@app.route('/api3', methods=['GET'])
def api3():
    print('API3 Request Received')
    return handle_get_request('message', 'image')


@app.route('/api4', methods=['POST'])
def api4():
    print('API4 Request Received')
    return handle_request('text', 'img', 'q', include_query_in_history=False)


@app.route('/api5', methods=['GET'])
def api5():
    print('API5 Request Received')
    return handle_get_request('data', 'file', 'search')


@app.route('/api6', methods=['POST'])
def api6():
    print('API6 Request Received')
    return handle_request('content', 'upload', '', include_query_in_history=True)


def handle_request(api_text_param, api_image_param, api_query_param, include_query_in_history):
    content_type = request.headers.get('Content-Type')

    # Output Full Request Content
    print(f"Received Content-Type: {content_type}")
    print(f"Received Data: {request.data}")
    print(f"Received Form: {request.form}")
    print(f"Received Files: {request.files}")

    if content_type == 'application/json':
        print('The payload is a JSON')
        text = request.json.get(api_text_param, 'The quick brown fox jumps over the lazy dog.')
        if not include_query_in_history:
            query = request.json.get(api_query_param, '')
            text += f" Query: {query}"
        return generate_response(text)
    elif content_type.startswith('multipart/form-data'):
        print('The payload is a multipart form data')
        text = request.form.get(api_text_param, 'The quick brown fox jumps over the lazy dog.')
        if not include_query_in_history:
            query = request.form.get(api_query_param, '')
            text += f" Query: {query}"
        return handle_image_request(text, api_image_param)
    else:
        return Response("Unsupported Media Type", status=415)


def handle_get_request(api_text_param, api_image_param, api_query_param=None):
    text = request.args.get(api_text_param, 'The quick brown fox jumps over the lazy dog.')
    query = request.args.get(api_query_param, '') if api_query_param else ''
    text = f"{text} Query: {query}" if query else text
    print(f"Received text (GET): {text}")

    image_data = request.args.get(api_image_param, None)
    images = []

    if image_data:
        # Decode the base64 encoded image
        image_filename = "image_from_get.png"
        image_path = os.path.join('uploads', image_filename)
        with open(image_path, "wb") as fh:
            fh.write(base64.b64decode(image_data))
        images.append({'filename': image_filename, 'size': os.path.getsize(image_path)})

    print(f"Received {len(images)} images from GET request")

    def generate():
        # Randomly select a sentence from the list
        response_text = random.choice(random_sentences)
        if images:
            response_text += f" Additionally, {len(images)} images were uploaded."
        for word in response_text.split():
            yield word + " "
            time.sleep(0.05)

    return Response(generate(), content_type='text/plain')


def handle_image_request(text, api_image_param):
    images = [file for key, file in request.files.items() if key.startswith(api_image_param)]

    print(f"Received text (POST): {text}")
    print(f"Received {len(images)} images: {[image.filename for image in images]}")

    image_info = []
    for image in images:
        filename = os.path.join('uploads', image.filename)
        image.save(filename)
        image_info.append({'filename': image.filename, 'size': os.path.getsize(filename)})

    print(f"Received {len(images)} images: {image_info}")

    def generate():
        response_text = random.choice(random_sentences) + f' {len(images)} images were uploaded.'
        for word in response_text.split():
            yield word + " "
            time.sleep(0.05)

    return Response(generate(), content_type='text/plain')


def generate_response(text):
    print(f"Received text (POST): {text}")

    def generate():
        response_text = random.choice(random_sentences)
        for word in response_text.split():
            yield word + " "
            time.sleep(0.05)

    return Response(generate(), content_type='text/plain')


if __name__ == '__main__':
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    app.run(host='0.0.0.0', port=5000, debug=True)
