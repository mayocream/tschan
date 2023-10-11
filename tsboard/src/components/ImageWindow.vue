<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Canvas, Image } from 'fabric'
import { useImages, useCanvas } from '../state'
import events from '../events'
import { storeCanvas, restoreCanvas, initialDetectAndOcr } from '../helpers/canvas'
import { readFileAsBlob } from '../libs/storage'
import { debounce } from '../libs/util'

const imagesStore = useImages()
const currentImage = imagesStore.currentImage

// avoid using canvas from the store directly to avoid reactivity
// otherwise the canvas event binding will be lost
const canvasStore = useCanvas()

const image = reactive({
  width: 0,
  height: 0,
})

let canvas: Canvas

const canvasWindow = ref<HTMLDivElement>()
const canvasNode = ref<HTMLCanvasElement>()
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
  let [width, height, zoomFactor] = zoomAspectRatio(image.width, image.height, inputZoom)
  canvas.setDimensions({ width, height }, { cssOnly: true })
  zoom.value = zoomFactor
}

const handlePanZoom = (e: WheelEvent) => {
  if (!e.ctrlKey) return
  e.preventDefault()
  e.stopPropagation()

  const delta = e.deltaY
  let zoomFactor = 0.999 ** delta * zoom.value
  setZoomAndTransform(zoomFactor)
}

const initCanvas = async (imageFile: File) => {
  if (!imageFile) return

  canvas =
    canvas ||
    new Canvas(canvasNode.value!, {
      enableRetinaScaling: true,
      selection: true,
      fireRightClick: true,
      stopContextMenu: true,
      controlsAboveOverlay: true,
    })

  // mount global canvas instance
  canvasStore.canvas.value = canvas
  events.emit('canvas:mounted', canvas)

  // events hook
  canvas.on('after:render', () => events.emit('canvas:rendered', canvas))

  const blob = await readFileAsBlob(imageFile)
  const img = await Image.fromURL(URL.createObjectURL(blob), {}, {})
  image.width = img.width
  image.height = img.height

  // clears canvas
  canvas.clear()

  // do not change the order of the layers
  canvas.preserveObjectStacking = true
  canvas.backgroundImage = img
  canvas.setDimensions({ width: image.width, height: image.height }, { backstoreOnly: true })

  setZoomAndTransform()

  if (!await restoreCanvas()) {
    await initialDetectAndOcr()
  }

  canvas.renderAll()
}

watch(currentImage, async () => {
  if (!currentImage) return
  await initCanvas(currentImage.value!)
})

onMounted(async () => {
  if (!currentImage) return
  await initCanvas(currentImage.value!)

  const debouncedStoreCanvas = debounce(storeCanvas, 100)
  events.on('canvas:rendered', () => {
    debouncedStoreCanvas()
  })
  events.on('canvas:initialDetectAndOcr', async () => {
    await initialDetectAndOcr()
  })
})
</script>

<template>
  <div class="flex grow overflow-auto preview" @wheel="handlePanZoom" ref="canvasWindow">
    <!-- https://stackoverflow.com/questions/33454533/cant-scroll-to-top-of-flex-item-that-is-overflowing-container -->
    <div class="m-auto">
      <canvas ref="canvasNode"></canvas>
    </div>
  </div>
  <div class="flex sticky bottom-0 w-full bg-base-200 h-[1.2rem] leading-[1.2rem] opacity-70">
    <input
      ref="zoomInputRef"
      class="w-[75px] text-[12px] text-center focus:outline-none bg-base-300 opacity-100 text-neutral"
      type="text"
      :value="zoomIndicator"
      @blur="setZoomAndTransform(($event.target as HTMLInputElement).value)"
      @keydown.enter=";($event.target as HTMLInputElement).blur()"
    />
    <!-- @vue-skip -->
    <span class="text-[12px] px-5 bg-base-300 text-neutral">{{ `${image.width} px x ${image.height} px (${window.devicePixelRatio} dppx)` }}</span>
  </div>
</template>

<style scoped>
.preview {
  background-image: repeating-linear-gradient(45deg, hsl(var(--b1)), hsl(var(--b1)) 13px, hsl(var(--b2)) 13px, hsl(var(--b2)) 14px);
}
</style>
