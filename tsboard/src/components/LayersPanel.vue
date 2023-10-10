<script setup lang="ts">
import type { Layer } from '../tschan'
import { useCanvas } from '../state'
import { onMounted, ref, watch } from 'vue'
import events from '../events'

const canvasStore = useCanvas()

const layers = ref<Layer[]>([])
const selected = ref<Layer>()

const syncLayers = () => {
  console.log('sync layers')
  const objects = canvasStore.objects.value
  if (!objects) return
  layers.value = objects.map((object) => {
    const layer = object.get('ts') as Layer
    return layer
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
  <!-- TODO: drag to sort layers? -->
  <div class="flex flex-col w-[20rem]">
    <div class="flex-1"></div>
    <div class="flex-1 h-[50%] overflow-auto border-t-[.6px] border-base-content">
      <div class="flex flex-col last:border-b-[0.4px] border-slate-500">
        <div
          v-for="layer in layers"
          :key="layer.id"
          @click="selectLayer(layer as Layer)"
          :data-active="selected?.id == layer.id"
          draggable="true"
          class="flex cursor-pointer select-none items-center text-sm h-[1.95rem] px-[2px] bg-base-100 data-[active=true]:bg-slate-700 data-[active=true]:border-y-[.4px] data-[active=true]:border-blue-500 border-t-[.4px] border-slate-500"
        >
          <span class="material-symbols-outlined text-[.875rem] opacity-[.9]">translate</span>
          <span class="w-[1.8rem] text-center opacity-[.9]">{{ layer?.textbox?.order }}</span>
          <span class="truncate inline-block max-w-[16.8rem] text-[.875rem] opacity-[.9]">{{ layer.name }}</span>
        </div>
        <div class="fixed bottom-0 flex bg-slate-800 h-[1.25rem] w-[20rem] text-center text-slate-400">
          <div class="ml-auto w-[1.2rem] mr-[0.7rem] cursor-pointer material-symbols-outlined text-[1.25rem] hover:text-slate-300 icon">
            arrow_upward
          </div>
          <div class="w-[1.2rem] mr-[0.7rem] cursor-pointer material-symbols-outlined text-[1.25rem] hover:text-slate-300 icon">
            arrow_downward
          </div>
          <div
            @click="deleteLayer"
            class="w-[1.2rem] mr-[0.5rem] cursor-pointer material-symbols-outlined text-[1.25rem] hover:text-slate-300 icon"
          >
            delete
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
