<script setup lang="ts">
import type { Object } from 'fabric'
import type { LayerProps } from '../tschan'
import { useCanvas } from '../store'
import { onMounted, ref, watch } from 'vue'
import events from '../events'

const canvasStore = useCanvas()

interface Layer extends LayerProps {
  object: Object
}

const layers = ref<Layer[]>([])

const syncLayers = () => {
  const objects = canvasStore.objects.value
  layers.value = objects.map((object) => {
    const { id, type, name, order } = object.get('ts') as LayerProps
    return {
      id,
      type,
      name,
      order,
      object: object,
    }
  })
}

watch(canvasStore.objects, syncLayers)
onMounted(() => {
  events.on('canvas:mounted', syncLayers)
  events.on('canvas:rendered', syncLayers)
})
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
