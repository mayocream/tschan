import { shallowRef, shallowReactive, computed } from 'vue'
import { Canvas, Object } from 'fabric'

const images = shallowReactive({
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

// TODO: support multiple canvas instances?
// ref: https://stackoverflow.com/questions/74833036/vue3-fabricjs-cannot-resize-edit-objects-created-using-a-reactive-variable-u
const canvas = shallowRef<Canvas>()

export const useCanvas = () => {
  const objects = computed(() => canvas.value?._objects as Object[])

  return { canvas, objects }
}
