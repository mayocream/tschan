<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useImages } from './state'
import { getCurrentImage, getImageList, getDirHandleFromIndexedDB } from './libs/storage'
import { requestQueue } from './helpers/request'
import ImageWindow from './components/ImageWindow.vue'
import LayersPanel from './components/LayersPanel.vue'
import ThumbnailsPanel from './components/ThumbnailsPanel.vue'
import TopMenu from './components/TopMenu.vue'
import ProjectManagement from './components/ProjectManagement.vue'
import TranslatePanel from './components/TranslatePanel.vue'
import Toolkit from './components/Toolkit.vue'

const imagesState = useImages()

onBeforeMount(async () => {
  // restore state from indexedDB
  imagesState.images.list = (await getImageList()) || []
  imagesState.images.current = (await getCurrentImage()) || imagesState.images.list[0]
  imagesState.images.dirHandle = await getDirHandleFromIndexedDB()
})
</script>

<template>
  <ProjectManagement v-if="!imagesState.images.list.length" />
  <!-- badass CSS :( -->
  <div v-if="imagesState.images.list.length" class="flex flex-col bg-base-200 h-screen w-screen">
    <!-- TODO: native menu -->
    <TopMenu />
    <progress v-if="requestQueue.length" max="100" class="fixed progress progress-warning w-full h-[0.2rem]"></progress>
    <div v-if="imagesState.images.list.length" class="flex grow min-h-0 min-w-0">
      <Toolkit />
      <ThumbnailsPanel />
      <!-- https://stackoverflow.com/questions/63601481/flex-child-is-overflowing-the-parent-container-even-after-setting-min-width0 -->
      <main class="flex flex-col grow min-h-0 min-w-0">
        <ImageWindow />
      </main>
      <aside class="flex">
        <div class="flex flex-col w-[20rem]">
          <TranslatePanel />
          <LayersPanel />
        </div>
      </aside>
    </div>
  </div>
</template>
