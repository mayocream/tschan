# from https://github.com/kha-white/mokuro/blob/master/mokuro/manga_page_ocr.py

import cv2
import numpy as np

from helper import download_model
from comic_text_detector.inference import TextDetector


class ComicTextDetector:
    def __init__(self,
                 pretrained_model_name_or_path='https://github.com/zyddnys/manga-image-translator/releases/download/beta-0.3/comictextdetector.pt',
                 detector_input_size=1024,
                 ):

        model = download_model(pretrained_model_name_or_path)

        self.text_detector = TextDetector(model_path=model, input_size=detector_input_size,
                                          device='cpu',
                                          act='leaky')

    def __call__(self, img):
        # img = np.array(img_or_path)
        H, W, *_ = img.shape
        mask, mask_refined, blk_list = self.text_detector(
            img, refine_mode=0, keep_undetected_mask=True)

        result = {'blocks': []}

        for blk_idx, blk in enumerate(blk_list):

            result_blk = {
                'box': [int(x) for x in blk.xyxy],
                'vertical': bool(blk.vertical),
                # 'font_size': float(blk.font_size),
                # 'line_spacing': float(blk.line_spacing),
                # 'font_family': blk.font_family,
                # 'bold': blk.bold,
                # 'underline': blk.underline,
                # 'italic': blk.italic,
                # 'stroke_width': blk.stroke_width,
                # 'font_colors': [x for x in blk.get_font_colors()],
                # 'lines_coords': [],
                # 'lines': [],
            }

            result['blocks'].append(result_blk)

        return mask, mask_refined, result


if __name__ == '__main__':
    import time
    import json

    detector = ComicTextDetector()

    img = cv2.imdecode(np.fromfile(
        'tests/03.jpg', dtype=np.uint8), cv2.IMREAD_COLOR)
    # img = Image.open('tests/01.jpg')

    start = time.time()

    _, mask, result = detector(img)

    end = time.time()

    print(json.dumps(result, indent=2))
    print(end - start)

    binary_mask = np.where(mask > 0, 255, 0).astype(np.uint8)
    masked_image = cv2.bitwise_and(img, img, mask=binary_mask)
    cv2.imwrite('tests/03-masked.jpg', masked_image)
