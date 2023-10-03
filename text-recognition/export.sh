#!/bin/sh

# ref: https://github.com/huggingface/transformers/issues/19604
optimum-cli export onnx --model kha-white/manga-ocr-base --task vision2seq-lm bin/

# https://huggingface.co/docs/transformers.js/custom_usage
python -m scripts.convert --quantize --model_id kha-white/manga-ocr-base --task vision2seq-lm
