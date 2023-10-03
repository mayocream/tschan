#!/usr/bin/env python3
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from manga_ocr import MangaOcr
from json import loads, dumps
from PIL import Image
import cgi
import os
import logging


logging.basicConfig(
    format='%(asctime)s %(levelname)-8s %(message)s',
    level=logging.INFO,
    datefmt='%Y-%m-%d %H:%M:%S')

logging.info("Preloading manga ocr model...")
mocr = MangaOcr()
logging.info("loaded!")


def inference_manga_ocr_h(self):
    content_type, pdict = cgi.parse_header(self.headers['content-type'])
    pdict['boundary'] = bytes(pdict['boundary'], "utf-8")
    form = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ={
                            'REQUEST_METHOD': 'POST', 'CONTENT_TYPE': self.headers['Content-Type'], })
    fileitem = form['image']

    image = Image.open(fileitem.file)
    image.save(os.path.join("uploaded", fileitem.filename))

    logging.info("Inference manga ocr...")

    # inference
    text = mocr(image)

    logging.info("Inference done!, result: %s", text)

    return dumps(text)


h = {
    "/inference/manga-ocr": inference_manga_ocr_h
}


class S(BaseHTTPRequestHandler):
    def _set_response(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-type', 'application/json')
        self.end_headers()

    def do_GET(self):
        logging.info("GET request, Path: %s", str(self.path))
        self._set_response()
        self.wfile.write("XOXO".encode('utf-8'))

    def do_POST(self):
        logging.info("POST request, Path: %s", str(self.path))

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
