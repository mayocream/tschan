<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Application, Sprite, Assets } from 'pixi.js'
import sampleImage from '../assets/128.jpg'

const canvasWindow = ref<HTMLDivElement>()
const canvas = ref<HTMLCanvasElement>()

const imageDimensions = computed(() => {
  return `770 px x 1080px (72ppi)`
})

const zoomAspectRatio = (imageWidth: number, imageHeight: number, zoomFactor?: number): [number, number, number] => {
  const screenWidth = canvasWindow.value!.clientWidth
  const screenHeight = canvasWindow.value!.clientHeight
  // scale to the screen size by default
  if (!zoomFactor) {
    zoomFactor = Math.min(screenWidth / imageWidth, screenHeight / imageHeight)
    zoomFactor = zoomFactor > 1 ? 1 : zoomFactor
  }
  return [imageWidth * zoomFactor, imageHeight * zoomFactor, zoomFactor]
}

onMounted(async () => {
  const bgTexture = await Assets.load(sampleImage)

  // let the canvas equal to the image, like an actual "canvas"
  const app = new Application({
    view: canvas.value!,
    width: bgTexture.width,
    height: bgTexture.height,
    resolution: window.devicePixelRatio,
    autoDensity: true,
  })

  const image = new Sprite(bgTexture)
  image.scale.set(1)

  image.anchor.x = 0
  image.anchor.y = 0
  image.position.x = 0
  image.position.y = 0


  const [imageWidth, imageHeight, zoomFactor] = zoomAspectRatio(bgTexture.width, bgTexture.height)


  app.view.style!.width = `${imageWidth}px`
  app.view.style!.height = `${imageHeight}px`

  console.log(imageWidth, imageHeight, zoomFactor)

  app.stage.addChild(image)

})
</script>

<template>
  <div class="flex grow justify-center preview overflow-auto pb-[1rem]" ref="canvasWindow">
    <canvas ref="canvas"></canvas>
  </div>
  <div class="flex fixed bottom-0 w-full bg-base-200 h-[1rem] leading-[1rem] opacity-70">
    <input
      ref="zoomInputRef"
      class="w-[75px] text-[12px] text-center focus:outline-none bg-slate-900 opacity-100"
      type="text"
    />
    <span class="text-[10px] px-5 bg-black">{{ imageDimensions }}</span>
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
