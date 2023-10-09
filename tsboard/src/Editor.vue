<script setup lang="ts">
import ImageWindow from './components/ImageWindow.vue'
import LayersPanel from './components/LayersPanel.vue'
import ThumbnailsPanel from './components/ThumbnailsPanel.vue'
import TopMenu from './components/TopMenu.vue'
import { useImages } from './state'
import ProjectManagement from './components/ProjectManagement.vue'
import { getCurrentImage, getImageList } from './libs/storage'
import { onBeforeMount, ref } from 'vue'

const imagesState = useImages()
const request = ref<Promise<Response>>()
const requestStartTime = ref(0)

// monkey patch fetch
const originalFetch = window.fetch
window.fetch = async (...args: Parameters<typeof fetch>) => {
  const response = originalFetch(...args)
  request.value = response
  requestStartTime.value = Date.now()
  return response.then((response) => {
    request.value = undefined
    requestStartTime.value = 0
    return response
  })
}

onBeforeMount(async () => {
  imagesState.images.list = (await getImageList()) || []
  imagesState.images.current = (await getCurrentImage()) || imagesState.images.list[0]
})
</script>

<template>
  <ProjectManagement v-if="!imagesState.images.list.length" />
  <!-- badass CSS :( -->
  <div v-if="imagesState.images.list.length" class="flex flex-col bg-gray-900 h-screen w-screen">
    <!-- TODO: native menu -->
    <TopMenu />
    <progress v-if="request && (Date.now() - requestStartTime < 10000)" max="100" class="fixed progress progress-warning w-full h-[0.2rem]" ></progress>
    <div v-if="imagesState.images.list.length" class="flex grow min-h-0 min-w-0">
      <ThumbnailsPanel />
      <!-- https://stackoverflow.com/questions/63601481/flex-child-is-overflowing-the-parent-container-even-after-setting-min-width0 -->
      <main class="flex flex-col grow min-h-0 min-w-0">
        <ImageWindow />
      </main>
      <aside class="flex">
        <LayersPanel />
      </aside>
    </div>
  </div>
</template>
