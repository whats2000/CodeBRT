import base64
import os
import time
import random

from flask import Flask, request, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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
def handle_request():
    content_type = request.headers.get('Content-Type')

    if content_type == 'application/json':
        return handle_text_request()
    elif content_type.startswith('multipart/form-data'):
        return handle_image_request()
    else:
        return Response("Unsupported Media Type", status=415)

@app.route('/api2', methods=['POST'])
def handle_request2():
    content_type = request.headers.get('Content-Type')

    print('API2')

    if content_type == 'application/json':
        return handle_text_request()
    elif content_type.startswith('multipart/form-data'):
        return handle_image_request()
    else:
        return Response("Unsupported Media Type", status=415)

@app.route('/api3', methods=['GET'])
def handle_get_request():
    text = request.args.get('message', 'The quick brown fox jumps over the lazy dog.')
    image_data = request.args.get('image', None)

    print(f"Received text (GET): {text}")
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


def handle_text_request():
    text = request.json.get('message', 'The quick brown fox jumps over the lazy dog.')

    print(f"Received text: {text}")

    def generate():
        response_text = random.choice(random_sentences)
        for word in response_text.split():
            yield word + " "
            time.sleep(0.05)

    return Response(generate(), content_type='text/plain')


def handle_image_request():
    text = request.form.get('message', 'The quick brown fox jumps over the lazy dog.')
    print("Form data:", request.form.to_dict())
    print("Files:", request.files.to_dict())

    images = [file for key, file in request.files.items() if key.startswith('image')]

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


if __name__ == '__main__':
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    app.run(host='0.0.0.0', port=5000, debug=True)
