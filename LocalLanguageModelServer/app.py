import os
import time

from flask import Flask, request, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


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


def handle_text_request():
    text = request.json.get('message', 'The quick brown fox jumps over the lazy dog.')

    print(f"Received text: {text}")

    def generate():
        response_text = (
            f"As a language model, I understand that means a quick brown fox is jumping over a lazy dog.")
        for word in response_text.split():
            yield word + " "
            time.sleep(0.05)

    return Response(generate(), content_type='text/plain')


def handle_image_request():
    text = request.form.get('message', 'The quick brown fox jumps over the lazy dog.')
    print("Form data:", request.form.to_dict())
    print("Files:", request.files.to_dict())

    images = [file for key, file in request.files.items() if key.startswith('images')]

    print(f"Received text: {text}")
    print(f"Received {len(images)} images: {[image.filename for image in images]}")

    image_info = []
    for image in images:
        filename = os.path.join('uploads', image.filename)
        image.save(filename)
        image_info.append({'filename': image.filename, 'size': os.path.getsize(filename)})

    print(f"Received {len(images)} images: {image_info}")

    def generate():
        response_text = (f"As a language model, I understand that means a quick brown fox is jumping over a lazy dog. "
                         f"Additionally, {len(images)} images were uploaded.")
        for word in response_text.split():
            yield word + " "
            time.sleep(0.05)

    # 刪除上傳的圖片
    for image in images:
        filename = os.path.join('uploads', image.filename)
        os.remove(filename)

    return Response(generate(), content_type='text/plain')


if __name__ == '__main__':
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    app.run(host='0.0.0.0', port=5000)
