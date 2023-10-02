import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { Canvas, Object } from 'fabric'

export const useImagesStore = defineStore('images', () => {
  const current = ref(0)
  const list = ref<string[]>([])

  const currentImage = computed(() => {
    return list.value[current.value]
  })

  return { current, list, currentImage }
})

export const useCanvasStore = defineStore('canvas', () => {
  const canvas = ref<Canvas>()
  const objects = computed(() => {
    return canvas.value?._objects as Object[]
  })

  return { canvas, objects }
})
