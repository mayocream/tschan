import { ref, reactive, computed } from 'vue'
import { Canvas, Object } from 'fabric'

const images = reactive({
  current: undefined as File | undefined,
  list: [] as File[],
})

export const useImages = () => {
  const currentImage = computed(() => images.current)
  return {
    images,
    currentImage,
  }
}

// this canvas lost DOM reference after being added to the store
const canvas = ref<Canvas>()

export const useCanvas = () => {
  const objects = computed(() => canvas.value?._objects as Object[])

  return { canvas, objects }
}
