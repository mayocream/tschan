<script setup lang="ts">
import type { Layer } from '../tschan'
import { useCanvas } from '../state'
import { onMounted, ref, watch } from 'vue'
import events from '../events'

const canvasStore = useCanvas()

const layers = ref<Layer[]>([])
const selected = ref<Layer>()

const syncLayers = () => {
  const objects = canvasStore.objects.value
  if (!objects) return
  layers.value = objects.map((object) => {
    const { id, type, name, order } = object.get('ts') as Layer
    return {
      id,
      type,
      name,
      order,
      object,
    }
  })
}

const selectLayer = (layer: Layer) => {
  selected.value = layer
  canvasStore.canvas.value?.setActiveObject(layer.object!)
}

const deleteLayer = () => {
  const layer = selected.value
  if (!layer) return
  canvasStore.canvas.value?.remove(layer.object!)
  canvasStore.canvas.value?.renderAll()
}

watch(canvasStore.objects, syncLayers)
onMounted(() => {
  syncLayers()
  events.on('canvas:mounted', syncLayers)
  events.on('canvas:rendered', syncLayers)
  events.on('canvas:ocr', syncLayers)
})
</script>

<template>
  <div class="flex flex-col w-[16rem]">
    <div class="flex-1"></div>
    <div class="flex-1">
      <div class="flex flex-col">
        <div
          v-for="layer in layers"
          :key="layer.id"
          @click="selectLayer(layer as Layer)"
          :data-active="selected?.id == layer.id"
          draggable="true"
          class="flex cursor-pointer select-none items-center text-sm h-[1.6rem] bg-slate-700 data-[active=true]:bg-slate-500"
        >
          <span class="px-2">{{ layer.order }}</span>
          <span class="truncate">{{ layer.name }}</span>
        </div>
        <!-- TODO: svg icons? -->
        <div class="fixed bottom-0 flex bg-slate-600 h-[1.5rem] w-[16rem] text-center">
          <div class="ml-auto w-[1.2rem] mr-[0.5rem] cursor-pointer">↑</div>
          <div class="w-[1.2rem] mr-[0.5rem] cursor-pointer">↓</div>
          <div @click="deleteLayer" class="w-[1.2rem] mr-[0.5rem] cursor-pointer">✕</div>
        </div>
      </div>
    </div>
  </div>
</template>
