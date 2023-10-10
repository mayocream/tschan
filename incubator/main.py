from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from ctd import ComicTextDetector
from manga_ocr import MangaOcr
from PIL import Image
from loguru import logger

app = Flask(__name__)
CORS(app)

logger.info("Preloading manga ocr model...")
mocr = MangaOcr()
logger.info("loaded!")

logger.info("Preloading comic text detector model...")
ctd = ComicTextDetector(manga_ocr_model=mocr)
logger.info("loaded!")


@app.route("/magic/manga-ocr", methods=['POST'])
def inference_manga_ocr():
    if 'image' not in request.files:
        return jsonify({"error": "Image not provided"}), 400

    fileitem = request.files['image']
    image = Image.open(fileitem)

    logger.info("Inference manga ocr...")

    # inference
    text = mocr(image)

    logger.info("Inference done!, result: {}", text)

    return jsonify(text)


@app.route("/magic/comic-text-detector+manga-ocr", methods=['POST'])
def inference_comic_text_detector():
    if 'image' not in request.files:
        return jsonify({"error": "Image not provided"}), 400

    fileitem = request.files['image']

    npimg = np.frombuffer(fileitem.read(), np.uint8)
    image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    logger.info("Inference comic text detector & manga ocr...")

    # inference
    _, mask, blks = ctd(image)

    logger.info("Inference done!, result: {}", blks)

    return jsonify({
        # 'mask': mask.tolist(),
        'blks': blks
    })


@app.route("/", methods=['GET'])
def index():
    return "XOXO"


if __name__ == '__main__':
    port = 43101
    app.run(port=port)
