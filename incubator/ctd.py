# from https://github.com/kha-white/mokuro/blob/master/mokuro/manga_page_ocr.py

import cv2
import numpy as np
from PIL import Image
from scipy.signal.windows import gaussian
from json import loads, dumps

from helper import download_model
from comic_text_detector.inference import TextDetector


class ComicTextDetector:
    def __init__(self,
                 manga_ocr_model,
                 pretrained_model_name_or_path='https://github.com/zyddnys/manga-image-translator/releases/download/beta-0.3/comictextdetector.pt.onnx',
                 detector_input_size=1024,
                 text_height=64,
                 max_ratio_vert=16,
                 max_ratio_hor=8,
                 anchor_window=2,
                 ):

        self.text_height = text_height
        self.max_ratio_vert = max_ratio_vert
        self.max_ratio_hor = max_ratio_hor
        self.anchor_window = anchor_window

        self.mocr = manga_ocr_model

        model = download_model(pretrained_model_name_or_path)

        self.text_detector = TextDetector(model_path=model, input_size=detector_input_size,
                                          device='cpu',
                                          act='leaky')

    def __call__(self, img):
        # img = np.array(img_or_path)
        H, W, *_ = img.shape
        mask, mask_refined, blk_list = self.text_detector(
            img, refine_mode=1, keep_undetected_mask=True)

        result = {'blocks': []}

        for blk_idx, blk in enumerate(blk_list):

            result_blk = {
                'box': [int(x) for x in blk.xyxy],
                'vertical': bool(blk.vertical),
                'font_size': float(blk.font_size),
                'line_spacing': float(blk.line_spacing),
                # 'font_family': blk.font_family,
                # 'bold': blk.bold,
                # 'underline': blk.underline,
                # 'italic': blk.italic,
                # 'stroke_width': blk.stroke_width,
                # 'font_colors': [x for x in blk.get_font_colors()],
                # 'lines_coords': [],
                'lines': [],
            }

            for line_idx, line in enumerate(blk.lines_array()):
                if blk.vertical:
                    max_ratio = self.max_ratio_vert
                else:
                    max_ratio = self.max_ratio_hor

                line_crops, cut_points = self.split_into_chunks(
                    img, mask_refined, blk, line_idx,
                    textheight=self.text_height, max_ratio=max_ratio, anchor_window=self.anchor_window)

                line_text = ''
                for line_crop in line_crops:
                    if blk.vertical:
                        line_crop = cv2.rotate(
                            line_crop, cv2.ROTATE_90_CLOCKWISE)
                    line_text += self.mocr(Image.fromarray(line_crop))

                # result_blk['lines_coords'].append(line.tolist())
                result_blk['lines'].append(line_text)

            result['blocks'].append(result_blk)

        return mask, mask_refined, result

    @staticmethod
    def split_into_chunks(img, mask_refined, blk, line_idx, textheight, max_ratio=16, anchor_window=2):
        line_crop = blk.get_transformed_region(img, line_idx, textheight)

        h, w, *_ = line_crop.shape
        ratio = w / h

        if ratio <= max_ratio:
            return [line_crop], []

        else:
            k = gaussian(textheight * 2, textheight / 8)

            line_mask = blk.get_transformed_region(
                mask_refined, line_idx, textheight)
            num_chunks = int(np.ceil(ratio / max_ratio))

            anchors = np.linspace(0, w, num_chunks + 1)[1:-1]

            line_density = line_mask.sum(axis=0)
            line_density = np.convolve(line_density, k, 'same')
            line_density /= line_density.max()

            anchor_window *= textheight

            cut_points = []
            for anchor in anchors:
                anchor = int(anchor)

                n0 = np.clip(anchor - anchor_window // 2, 0, w)
                n1 = np.clip(anchor + anchor_window // 2, 0, w)

                p = line_density[n0:n1].argmin()
                p += n0

                cut_points.append(p)

            return np.split(line_crop, cut_points, axis=1), cut_points


if __name__ == '__main__':
    from manga_ocr import MangaOcr
    import time
    import json

    manga_ocr = MangaOcr()
    detector = ComicTextDetector(manga_ocr_model=manga_ocr)

    img = cv2.imdecode(np.fromfile('tests/01.jpg', dtype=np.uint8), cv2.IMREAD_COLOR)
    # img = Image.open('tests/01.jpg')

    start = time.time()

    _, mask, result = detector(img)

    end = time.time()

    print(json.dumps(result, indent=2))
    print(end - start)
