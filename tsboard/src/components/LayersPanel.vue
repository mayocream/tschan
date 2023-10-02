<script setup lang="ts">
import type { Object } from 'fabric'
import type { LayerProps } from '../tschan'
import { storeToRefs } from 'pinia'
import { useCanvasStore } from '../store'
import { watch, ref } from 'vue'

const canvasStore = useCanvasStore()
const { canvas, objects } = storeToRefs(canvasStore)

interface Layer extends LayerProps {
  object: Object
}

const layers = ref<Layer[]>([])

watch(
  objects,
  () => {
    layers.value = canvas.value!.getObjects().map((object) => {
      const { id, type, name, order } = object.get('ts') as LayerProps
      return {
        id,
        type,
        name,
        order,
        object: object,
      }
    })
  },
  { deep: true }
)
</script>

<template>
  <div class="flex flex-col w-[14rem]">
    <div class="grow min-h-0 min-w-0"></div>
    <div class="grow min-h-0 min-w-0">
      <div class="flex flex-col">
        <div v-for="layer in layers" :key="layer.id" class="flex">
          <div>{{ layer.order }} {{ layer.name }}</div>
        </div>
        <div class="fixed bottom-0 flex bg-slate-600 h-[1.5rem] w-[14rem]"></div>
      </div>
    </div>
  </div>
</template>
