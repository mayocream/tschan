import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: '.',
        },
        {
          src: '../bin/yolov8n.onnx',
          dest: 'models',
        },
        // for debugging
        {
          src: '../datasets/bluearchive_comics/images',
          dest: 'samples'
        }
      ],
    }),
  ],
})
