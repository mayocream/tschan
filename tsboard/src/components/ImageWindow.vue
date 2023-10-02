<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Canvas, Image, Rect, Circle, Text, Group } from 'fabric'
import { inferenceYoloDetection } from '../libs/inferenceOnnx'
import { orderTextBoxes } from '../libs/manga'
import { useImagesStore, useCanvasStore } from '../store'
import { uid } from '../libs/uid'
import { LayerProps } from '../tschan'

const imagesStore = useImagesStore()
const canvasStore = useCanvasStore()
const { canvas } = storeToRefs(canvasStore)
const { currentImage } = storeToRefs(imagesStore)

const fontScaleRatio = computed(() => Math.max(1, image.height / 1080))

const image = reactive({
  width: 0,
  height: 0,
})

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
  canvas.value!.setDimensions({ width, height }, { cssOnly: true })
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

const detectBoxes = async (imageSrc: string) => {
  const boxes = await inferenceYoloDetection(imageSrc)
  const textBoxes = orderTextBoxes(
    boxes.filter((box) => box[4] == 'frame'),
    boxes.filter((box) => box[4] == 'text')
  )

  textBoxes.forEach((box, i) => {
    const rect = new Rect({
      left: box[0] * image.width,
      top: box[1] * image.height,
      width: box[2] * image.width - box[0] * image.width,
      height: box[3] * image.height - box[1] * image.height,
      stroke: 'red',
      strokeWidth: 2 * fontScaleRatio.value,
      fill: 'transparent',
      opacity: 0.4,
      rx: 4 * fontScaleRatio.value,
    })

    const circle = new Circle({
      radius: 12 * fontScaleRatio.value,
      fill: 'red',
      left: rect.left,
      top: rect.top,
      originX: 'center',
      originY: 'center',
      opacity: 0.7,
    })

    const text = new Text(`${i + 1}`, {
      fontSize: 16 * fontScaleRatio.value,
      fontFamily: 'system-ui, sans-serif',
      fontWeight: 'bold',
      fill: 'white',
      left: circle.left,
      top: circle.top,
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
    })

    const group = new Group([rect, circle, text], {
      // lock movement by default until the user clicks on the layer
      hoverCursor: 'default',
      interactive: true,
      selectable: true,
      hasControls: true,
    })

    group.set('ts', <LayerProps>{
      id: uid(),
      type: 'textbox',
      name: `Text...`,
      order: i,
    })

    canvas.value!.add(group)
    canvas.value!.renderAll()
  })
}

const initCanvas = async (imageSrc: string) => {
  const img = await Image.fromURL(imageSrc, {}, {})
  image.width = img.width
  image.height = img.height

  if (canvas.value) {
    canvas.value.clear()
  } else {
    canvasStore.canvas = new Canvas(canvasNode.value!, {
      enableRetinaScaling: true,
      selection: true,
      fireRightClick: true,
      stopContextMenu: true,
      controlsAboveOverlay: true,
    })
  }

  // do not change the order of the layers
  // canvas.value!.preserveObjectStacking = true
  canvas.value!.backgroundImage = img
  canvas.value!.setDimensions({ width: image.width, height: image.height }, { backstoreOnly: true })

  setZoomAndTransform()
  canvas.value!.renderAll()

  await detectBoxes(imageSrc)
}

watch(currentImage, async () => {
  if (!currentImage) return
  await initCanvas(currentImage.value)
})

onMounted(async () => {
  await initCanvas(currentImage.value)
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
      class="w-[75px] text-[12px] text-center focus:outline-none bg-slate-900 opacity-100 text-white"
      type="text"
      :value="zoomIndicator"
      @blur="setZoomAndTransform(($event.target as HTMLInputElement).value)"
      @keydown.enter=";($event.target as HTMLInputElement).blur()"
    />
    <!-- @vue-skip -->
    <span class="text-[12px] px-5 bg-black">{{
      `${image.width} px x ${image.height} px (${window.devicePixelRatio} dppx)`
    }}</span>
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
