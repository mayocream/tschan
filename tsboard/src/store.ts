import { ref, reactive, computed } from 'vue'
import { Canvas, Object } from 'fabric'

const images = reactive({
  current: 0,
  list: [] as string[],
})

export const useImages = () => {
  const currentImage = computed(() => images.list[images.current])
  return {
    images,
    currentImage,
  }
}

const canvas = ref<Canvas>()

export const useCanvas = () => {
  const objects = computed(() => canvas.value?._objects as Object[])

  return { canvas, objects }
}
