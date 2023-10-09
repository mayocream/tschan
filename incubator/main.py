#!/usr/bin/env python3
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import cv2
import numpy as np
from ctd import ComicTextDetector
from manga_ocr import MangaOcr
from json import loads, dumps
from PIL import Image
import cgi
import logging

logging.basicConfig(
    format='%(asctime)s %(levelname)-8s %(message)s',
    level=logging.INFO,
    datefmt='%Y-%m-%d %H:%M:%S')

logging.info("Preloading manga ocr model...")
mocr = MangaOcr()
logging.info("loaded!")

logging.info("Preloading comic text detector model...")
ctd = ComicTextDetector(manga_ocr_model=mocr)
logging.info("loaded!")


def inference_manga_ocr_h(self):
    fileitem = self._get_image()

    image = Image.open(fileitem.file)

    logging.info("Inference manga ocr...")

    # inference
    text = mocr(image)

    logging.info("Inference done!, result: %s", text)

    return dumps(text)


# image resized to 1024x1024 before inference
def inference_comic_text_detector(self):
    fileitem = self._get_image()

    image = cv2.imdecode(np.fromfile(
        fileitem.file, dtype=np.uint8), cv2.IMREAD_COLOR)

    logging.info("Inference comic text detector & manga ocr...")

    # inference
    _, mask, blks = ctd(image)

    logging.info("Inference done!, result: %s", blks)

    return dumps({
        # 'mask': mask.tolist(),
        'blks': blks
    })


h = {
    "/magic/manga-ocr": inference_manga_ocr_h,
    "/magic/comic-text-detector+manga-ocr": inference_comic_text_detector,
}


class S(BaseHTTPRequestHandler):
    def _set_response(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers',
                         'Origin, Content-Type, Accept')
        self.send_header('Content-type', 'application/json')
        self.end_headers()

    def _get_image(self):
        content_type, pdict = cgi.parse_header(self.headers['content-type'])
        pdict['boundary'] = bytes(pdict['boundary'], "utf-8")
        form = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ={
                                'REQUEST_METHOD': 'POST', 'CONTENT_TYPE': self.headers['Content-Type'], })
        fileitem = form['image']
        return fileitem

    def do_OPTIONS(self):
        self._set_response()

    def do_GET(self):
        self._set_response()
        self.wfile.write("XOXO".encode('utf-8'))

    def do_POST(self):

        # handles the request
        # error thrown in thread if not hit the handler
        response = h[self.path](self)

        self._set_response()
        self.wfile.write(response.encode('utf-8'))


def run(handler_class=S, port=43101):
    server_address = ('', port)
    httpd = ThreadingHTTPServer(server_address, handler_class)
    logging.info('Starting httpd...\n')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    logging.info('Stopping httpd...\n')


if __name__ == '__main__':
    from sys import argv

    if len(argv) == 2:
        run(port=int(argv[1]))
    else:
        run()
