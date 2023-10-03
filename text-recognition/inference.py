import re
import time
from pathlib import Path

import jaconv
import torch
from PIL import Image
from transformers import AutoFeatureExtractor, AutoTokenizer, VisionEncoderDecoderModel

import warnings
warnings.filterwarnings("ignore")

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

    def __call__(self, img_or_path, boxes=[]):
        if isinstance(img_or_path, str) or isinstance(img_or_path, Path):
            img = Image.open(img_or_path)
        elif isinstance(img_or_path, Image.Image):
            img = img_or_path
        else:
            raise ValueError(
                f'img_or_path must be a path or PIL.Image, instead got: {img_or_path}')

        img = img.convert('L').convert('RGB')

        results = []
        for idx, box in enumerate(boxes):
            start_time = time.time()

            x1, y1, x2, y2 = box
            roi = img.crop((x1, y1, x2, y2))
            x = self._preprocess(roi)
            x = self.model.generate(x[None].to(
                self.model.device), max_length=300)[0].cpu()
            x = self.tokenizer.decode(x, skip_special_tokens=True)
            x = post_process(x)
            results.append(x)

            end_time = time.time()  # <-- Measure end time
            print(f"Runtime for Box {idx + 1}: {end_time - start_time:.4f} seconds")  # <-- Print runtime

        return results

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


if __name__ == '__main__':
    mocr = MangaOcr()
    boxes = [[267.3335727453232, 116.73328113555908, 334.2141672372818, 261.8436040878296], [356.4218158721924, 275.4634280204773, 385.813196182251, 426.9409375190735], [106.01632165908813, 224.59347581863403, 173.62107491493225, 383.56838178634644], [630.4916567802429, 821.9468593597412, 669.921097278595, 979.9121646881104], [
        589.5551524162292, 552.6316595077515, 663.723358631134, 699.244912147522], [274.1417409181595, 552.702675819397, 342.08759009838104, 685.716742515564], [99.81073945760727, 750.4704608917236, 156.70382314920425, 783.6404857635498], [92.30668419599533, 621.6418762207031, 139.05012637376785, 733.5494728088379]]
    results = mocr('datasets/bluearchive_comics/images/1.jpg', boxes)
    for idx, result in enumerate(results):
        print(f"Box {idx + 1}: {result}")
