# TSちゃん！

TSちゃん(chan), the Automated Manga Translation Pipeline.
**tschan** is a collection of Web Application, Desktop Application, Machine Learning models / training scripts and CLI tools to automate the translation of manga.

## Web Editor (tsboard)

The web editor is a web application that allows you to translate manga pages.
The editor is available at [https://ts.e.ki](https://ts.e.ki).

`tsboard` is written in TypeScript, using [Vue3](https://vuejs.org/) and [Tailwind CSS](https://tailwindcss.com/).
Its editor system is based on [fabric.js](http://fabricjs.com/), which uses browser's Canvas API to render the image and text.
Retina is supported, and the editor is optimized for high resolution display.

A tiny pre-trained object detection model ([YOLOv8](https://docs.ultralytics.com/)) is bundled with the editor, which is used to detect speech bubbles and text lines automatically. The model is exported to the ONNX format, and run in web with [ONNXRuntime](https://onnxruntime.ai/) (WebAssembly backend).

[manga-ocr](https://github.com/kha-white/manga-ocr) is used to recognize text in marked areas.
It's hard to get it running with ONNXRuntime, alternatively, we use hosted inference API provided by [Hugging Face](https://huggingface.co/docs/api-inference/index).
Be aware that the API may be unstable, and rate limit applied to the API.
We provide a proxied version of the API with [Cloudflare Workers](https://workers.cloudflare.com/), which is used by default.

The auto translation feature is powered by [GPT-4](https://openai.com/gpt-4), a proxied version of the API is also provided by Cloudflare Workers.

Note: the editor is still in early development, and may be unstable.

## Desktop Editor

The desktop version of the editor is available for Windows, macOS and Linux, written with [Tauri](https://tauri.app/) in Rust.
It is basically a wrapper of the web editor, but with some additional features (maybe).

*Working on bundling the Python server into the desktop version...*

## Photoshop Plugin

The Photoshop plugin allows you to import translated text from the editor into Photoshop.
The plugin is written in [UXP](https://developer.adobe.com/photoshop/uxp/2022/), and available for Photoshop 2021+

## Incubator Mode

Incubator mode is Evil, but it's the only way to get things done locally.
In this mode, a python server is started on port `43101`, it serves the APIs for ML inference.

You may install [PyTorch](https://pytorch.org/get-started/locally/) first, then install the dependencies and start the server:

```bash
pip install -r incubator/requirements.txt
python incubator/main.py
```

The tsboard will try to connect to the incubator server automatically.

## Acknowledgements

List of third-party resources used in this project.

- [Manga109](http://www.manga109.org/en/index.html)
- [COO: Comic onomatopoeia dataset](https://github.com/ku21fan/COO-Comic-Onomatopoeia)
- [Mask Dataset for: Unconstrained Text Detection in Manga: a New Dataset and Baseline](https://zenodo.org/record/4511796)
- [OpenMantra dataset](https://github.com/mantra-inc/open-mantra-dataset)
- [Kuzushiji-MNIST](https://github.com/rois-codh/kmnist)

## References

- [Towards Fully Automated Manga Translation](https://arxiv.org/abs/2012.14271)
- [Unconstrained Text Detection in Manga: a New Dataset and Baseline](https://arxiv.org/abs/2009.04042)
