import re
# import time
from pathlib import Path

import jaconv
import torch
from PIL import Image
from transformers import AutoFeatureExtractor, AutoTokenizer, VisionEncoderDecoderModel
from scipy.signal.windows import gaussian
import numpy as np


# TODO: support splitting text into multiple lines
class MangaOcr:
    def __init__(self, pretrained_model_name_or_path='kha-white/manga-ocr-base', force_cpu=False):
        self.feature_extractor = AutoFeatureExtractor.from_pretrained(
            pretrained_model_name_or_path)
        self.tokenizer = AutoTokenizer.from_pretrained(
            pretrained_model_name_or_path)
        self.model = VisionEncoderDecoderModel.from_pretrained(
            pretrained_model_name_or_path)

        if not force_cpu and torch.cuda.is_available():
            self.model.cuda()

    def __call__(self, img_or_path):
        if isinstance(img_or_path, str) or isinstance(img_or_path, Path):
            img = Image.open(img_or_path)
        elif isinstance(img_or_path, Image.Image):
            img = img_or_path
        else:
            raise ValueError(
                f'img_or_path must be a path or PIL.Image, instead got: {img_or_path}')

        img = img.convert('L').convert('RGB')

        x = self._preprocess(img)
        x = self.model.generate(x[None].to(
            self.model.device), max_length=300)[0].cpu()
        x = self.tokenizer.decode(x, skip_special_tokens=True)
        x = post_process(x)

        return x

    def _preprocess(self, img):
        pixel_values = self.feature_extractor(
            img, return_tensors="pt").pixel_values
        return pixel_values.squeeze()


def post_process(text):
    text = ''.join(text.split())
    text = text.replace('…', '...')
    text = re.sub('[・.]{2,}', lambda x: (x.end() - x.start()) * '.', text)
    text = jaconv.h2z(text, ascii=True, digit=True)

    return text
