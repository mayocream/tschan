import { shallowRef, shallowReactive, computed, ref } from 'vue'
import { Canvas, Object } from 'fabric'

const images = shallowReactive({
  current: undefined as File | undefined,
  list: [] as File[],
  dirHandle: undefined as FileSystemDirectoryHandle | undefined,
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

// TODO: change cursor based on tool
const tool = ref('selector')
export const useTool = () => {
  return { tool }
}
