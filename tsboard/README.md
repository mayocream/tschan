# tsboard

## Considérations

It was first built with React, but the state management was too complicated for the scope of the project. I then switched to Vue, which is much more simple to use :)

## Desktop Application

The desktop application is built with Tauri. Written in Rust, it is a wrapper around a webview, which empowers the application with native features.
The communication between the webview and the Rust code is done through IPC.

## Web Application

It is a SPA, which communicates with the backend through HTTP requests.


## Development

Download models to `bin` folder:

```bash
wget https://github.com/mayocream/tschan/releases/download/v0.0.0/yolov8n.onnx -O bin/yolov8n.onnx
```

Run:

```bash
pnpm run dev
```
