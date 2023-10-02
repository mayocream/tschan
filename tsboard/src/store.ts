import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useImagesStore = defineStore('images', () => {
  const current = ref(0)
  const list = ref<string[]>([])

  function setCurrent(index: number) {
    current.value = index
  }

  const currentImage = computed(() => {
    return list.value[current.value]
  })

  return { current, list, setCurrent, currentImage }
})
