<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Application, Sprite, Assets } from 'pixi.js'
import sampleImage from '../assets/128.jpg'

let app: Application

const canvasWindow = ref<HTMLDivElement>()
const canvas = ref<HTMLCanvasElement>()
const zoom = ref(1)
const zoomIndicator = computed(() => `${(zoom.value * 100).toPrecision(4)}%`)

const zoomAspectRatio = (imageWidth: number, imageHeight: number, zoomFactor?: number): [number, number, number] => {
  const screenWidth = canvasWindow.value!.clientWidth
  const screenHeight = canvasWindow.value!.clientHeight
  // scale to the screen size by default
  zoomFactor = zoomFactor ?? Math.min(screenWidth / imageWidth, screenHeight / imageHeight, 1)
  zoomFactor = Math.min(Math.max(zoomFactor, 0.01), 10)
  return [Math.floor(imageWidth * zoomFactor), Math.floor(imageHeight * zoomFactor), zoomFactor]
}

const setZoomAndTransform = (value?: string | number) => {
  const inputZoom = typeof value == 'string' ? parseFloat(value) / 100 : value
  let [width, height, zoomFactor] = zoomAspectRatio(app.renderer.width, app.renderer.height, inputZoom)
  app.view.style!.width = `${width}px`
  app.view.style!.height = `${height}px`
  zoom.value = zoomFactor
}

const handlePanZoom = (e: WheelEvent) => {
  if (!e.ctrlKey) return
  e.preventDefault()
  e.stopPropagation()

  const delta = e.deltaY
  let zoomFactor = (0.999 ** delta) * zoom.value
  setZoomAndTransform(zoomFactor)
}

onMounted(async () => {
  const bgTexture = await Assets.load(sampleImage)

  // let the canvas equal to the image, like an actual "canvas"
  app = new Application({
    view: canvas.value!,
    width: bgTexture.width,
    height: bgTexture.height,
    // image scaled unexpectedly if resolution > 2, kept 1 for now
    resolution: 1,
    autoDensity: false,
  })

  const image = new Sprite(bgTexture)

  setZoomAndTransform()

  app.stage.addChild(image)
})
</script>

<template>
  <div class="flex grow overflow-auto preview" @wheel="handlePanZoom" ref="canvasWindow">
    <!-- https://stackoverflow.com/questions/33454533/cant-scroll-to-top-of-flex-item-that-is-overflowing-container -->
    <div class="m-auto">
      <canvas ref="canvas"></canvas>
    </div>
  </div>
  <div class="flex sticky bottom-0 w-full bg-base-200 h-[1.2rem] leading-[1.2rem] opacity-70">
    <input
      ref="zoomInputRef"
      class="w-[75px] text-[12px] text-center focus:outline-none bg-slate-900 opacity-100"
      type="text"
      :value="zoomIndicator"
      @blur="setZoomAndTransform(($event.target as HTMLInputElement).value)"
      @keydown.enter="($event.target as HTMLInputElement).blur()"
    />
    <!-- @vue-skip -->
    <span class="text-[12px] px-5 bg-black">{{ `${canvas?.width} px x ${canvas?.height} px (${window.devicePixelRatio} dppx)` }}</span>
  </div>
</template>

<style scoped>
.preview {
  background-image: repeating-linear-gradient(
    45deg,
    hsl(var(--b1)),
    hsl(var(--b1)) 13px,
    hsl(var(--b2)) 13px,
    hsl(var(--b2)) 14px
  );
}
</style>
