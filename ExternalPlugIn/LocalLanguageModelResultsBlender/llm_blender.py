from llm_blender import BlenderConfig, RankerConfig, GenFuserConfig
from llm_blender import Blender
import torch
import json
import os
import time
import numpy as np
from flask import Flask, request, Response
from flask_cors import CORS

app = Flask(__name__)  # _name_ 代表目前執行的模組
CORS(app)

# Global variable for storing the loaded model
blender = None
ranker_model = None
fuser_model = None

@app.route('/', methods=['POST'])
def llm_blender():
    global blender
    global ranker_model
    global fuser_model
    print('API Request Received')
    # Now handle the request for ranking or other operations
    data = request.json
    model_name = data.get('model_name', {
        "ranker": "llm-blender/PairRM",
        "fuser": "llm-blender/gen_fuser_770m"
    })
    mode = data.get('mode', "rank")
    if blender is None:
        # Load the model only if it is not already loaded
        cache_dir = './llm_blender/model/'
        check_model_loaded = load_model(model_name, cache_dir, mode)
        if check_model_loaded["status"] != 200:
            blender = None
            return Response(check_model_loaded["message"], status=check_model_loaded["status"])
        ranker_model = model_name["ranker"]
        fuser_model = model_name["fuser"]
    else:
        if model_name["ranker"] != ranker_model or model_name["fuser"] != fuser_model:
            # clear the model and reload the new model
            blender = None
            print("The models were changed. Cleared existing model. Reloading new model...")
            cache_dir = './llm_blender/model/'
            check_model_loaded = load_model(model_name, cache_dir, mode)
            if check_model_loaded["status"] != 200:
                blender = None
                return Response("After the model were changed.", check_model_loaded["message"], status=check_model_loaded["status"])
            ranker_model = model_name["ranker"]
            fuser_model = model_name["fuser"]

    inputs = data.get('inputs', [])
    candidates_texts = data.get('candidates_texts', [[]])
    if mode == "rank":
        return rank(inputs, candidates_texts)
    elif mode == "fuse":
        return fuse(inputs, candidates_texts)
    elif mode == "rank_and_fuse":
        return rank_and_fuse(inputs, candidates_texts)
    else:
        return Response("Mode is unknown", status=400)


def load_model(model_name, cache_dir, mode):
    global blender
    print("Loading model...")

    # 紀錄模型加載開始時間
    loading_model_start_time: float = time.time()

    content_type = request.headers.get('Content-Type')
    # Output Full Request Content
    print(f"Received Content-Type: {content_type}")

    if content_type == 'application/json':
        device = ('cuda' if torch.cuda.is_available() else 'cpu')
        print("device:", device)
        # check format of model's path
        model_config = check_model_and_config(cache_dir, model_name)
        if model_config["status"] == 404:
            return Response(model_config["message"], status=model_config["status"])

        blender = Blender(
            blender_config=BlenderConfig(
                device=device,
            ),
            ranker_config=RankerConfig(
                ranker_type=model_config["ranker_config"]["ranker_type"],
                model_type=model_config["ranker_config"]["model_type"],
                model_name=model_config["ranker_config"]["model_name"],
                cache_dir=cache_dir,
                load_checkpoint=model_config["ranker_model_path"],
                device=device,
                source_maxlength=1224,
                candidate_maxlength=412,
            ),
            fuser_config=GenFuserConfig(
                model_name=model_name["fuser"],
                cache_dir=cache_dir,
                device=device
            )
        )
        if mode == "rank":
            blender.loadranker(model_name["ranker"])  # load ranker checkpoint
        else:
            blender.loadfuser(model_name["fuser"])

        # 紀錄結束時間
        loading_model_end_time = time.time()
        # 計算程式執行時間
        loading_model_execution_time = loading_model_end_time - loading_model_start_time
        print(f"Spend time of loading model：{loading_model_execution_time:.2f} 秒")

        return {"status": 200, "message": "Success"}
    else:
        return {"status": 415, "message": "Unsupported Media Type"}


def check_model_and_config(cache_dir, model_name):
    ranker_model_path = os.path.join(cache_dir, model_name["ranker"])
    fuser_model_path = os.path.join(cache_dir, model_name["fuser"])
    ranker_config_path = os.path.join(ranker_model_path, "config.json")
    # check file existing
    if not os.path.exists(ranker_model_path):
        return {"status": 404, "message": f"Model path {ranker_model_path} not found."}
    if not os.path.exists(fuser_model_path):
        return {"status": 404, "message": f"Model path {fuser_model_path} not found."}
    # read config.json of ranker
    if not os.path.exists(ranker_config_path):
        return {"status": 404, "message": f"Ranker config file {ranker_config_path} not found."}
    with open(ranker_config_path, 'r') as f:
        ranker_config = json.load(f)
    if not all(key in ranker_config for key in ["ranker_type", "model_type", "model_name"]):
        return {"status": 400, "message": "Ranker config is missing required parameters."}

    return {"status": 200, "ranker_model_path": ranker_model_path, "fuser_model_path": fuser_model_path,
            "ranker_config": ranker_config}


def rank(inputs, candidates_texts):
    print("Ranking...")
    # 紀錄模型加載開始時間
    loading_model_start_time: float = time.time()
    print(f"Received inputs (POST): {inputs}")
    print(f"Received candidates_texts (POST): {candidates_texts}")
    ranks = blender.rank(inputs, candidates_texts, return_scores=False, batch_size=1)

    # Convert numpy arrays to lists
    ranks = [rank.tolist() if isinstance(rank, np.ndarray) else rank for rank in ranks]

    # 紀錄結束時間
    loading_model_end_time = time.time()
    # 計算程式執行時間
    loading_model_execution_time = loading_model_end_time - loading_model_start_time
    print(f"Spend time of ranking：{loading_model_execution_time:.2f} 秒")

    response = {
        "ranks": ranks[0],
        "status": 200,
        "message": "Success"
    }
    print(f"ranks: {ranks[0]}")
    return Response(json.dumps(response), status=200, mimetype='application/json')


def fuse(inputs, candidates_texts):
    print("Fusing...")
    # 紀錄模型加載開始時間
    loading_model_start_time: float = time.time()
    print(f"Received inputs (POST): {inputs}")
    print(f"Received candidates_texts (POST): {candidates_texts}")
    fuse_generations, ranks = blender.rank_and_fuse(inputs, candidates_texts, return_scores=False, batch_size=2,
                                                    top_k=2)
    # Convert numpy arrays to lists
    fuse_generations = [gen.tolist() if isinstance(gen, np.ndarray) else gen for gen in fuse_generations]

    # 紀錄結束時間
    loading_model_end_time = time.time()
    # 計算程式執行時間
    loading_model_execution_time = loading_model_end_time - loading_model_start_time
    print(f"Spend time of fusing：{loading_model_execution_time:.2f} 秒")

    response = {
        "fuse_generations": fuse_generations[0],
        "status": 200,
        "message": "Success"
    }
    print(f"fuse_generations: {fuse_generations[0]}")
    return Response(json.dumps(response), status=200, mimetype='application/json')


def rank_and_fuse(inputs, candidates_texts):
    print("Ranking and Fusing...")
    # 紀錄模型加載開始時間
    loading_model_start_time: float = time.time()
    print(f"Received inputs (POST): {inputs}")
    print(f"Received candidates_texts (POST): {candidates_texts}")
    fuse_generations, ranks = blender.rank_and_fuse(inputs, candidates_texts, return_scores=False, batch_size=2,
                                                    top_k=2)
    # Convert numpy arrays to lists
    fuse_generations = [gen.tolist() if isinstance(gen, np.ndarray) else gen for gen in fuse_generations]
    ranks = [rank.tolist() if isinstance(rank, np.ndarray) else rank for rank in ranks]

    # 紀錄結束時間
    loading_model_end_time = time.time()
    # 計算程式執行時間
    loading_model_execution_time = loading_model_end_time - loading_model_start_time
    print(f"Spend time of ranking and fusing：{loading_model_execution_time:.2f} 秒")

    response = {
        "fuse_generations": fuse_generations[0],
        "ranks": ranks[0],
        "status": 200,
        "message": "Success"
    }
    print(f"ranks: {ranks[0]}")
    print(f"fuse_generations: {fuse_generations[0]}")
    return Response(json.dumps(response), status=200, mimetype='application/json')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3500)  # 立刻啟動伺服器
