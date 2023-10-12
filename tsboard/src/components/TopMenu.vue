<script setup lang="ts">
import events from '../events'
import { ocr, detectTextBoxes, storeCanvas } from '../helpers/canvas'
import { getImageList, openLocalFolder } from '../libs/storage'
import { useImages } from '../state'
import { isIncubatorAvailable } from '../libs/incubator'
import { onMounted, ref } from 'vue'

const imagesState = useImages()
const isIncubator = ref(false)

const openProject = async () => {
  await openLocalFolder()
  imagesState.images.list = (await getImageList()) || []
  imagesState.images.current = imagesState.images.list[0]
  events.emit('project:open')
}

// https://reacthustle.com/blog/how-to-close-daisyui-dropdown-with-one-click
const blur = () => {
  ;(document.activeElement as HTMLElement)?.blur()
}

const ocrHandler = async () => {
  await ocr()
  blur()
}

const detectHandler = async () => {
  await detectTextBoxes()
  blur()
}

const saveHandler = async () => {
  await storeCanvas()
  blur()
}

onMounted(async () => {
  isIncubator.value = await isIncubatorAvailable
})
</script>

<template>
  <!-- bugy CSS but it works -->
  <div class="flex flex-row h-[34px]">
    <div class="dropdown">
      <label tabindex="0" class="rounded-none h-[34px] leading-[40px] font-normal text-[1rem] btn btn-sm text-neutral capitalize"
        >File</label
      >
      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-300 w-52 text-neutral">
        <!-- <li><a>Open File...</a></li> -->
        <li><a @click="openProject">Open Project...</a></li>
        <div class="divider my-0"></div>
        <li>
          <a @click="saveHandler">Save<span class="ml-auto">Ctrl + S</span></a>
        </li>
        <li><a>Save As...</a></li>
      </ul>
    </div>
    <div class="dropdown">
      <label tabindex="0" class="rounded-none h-[34px] leading-[40px] font-normal text-[1rem] btn btn-sm text-neutral capitalize"
        >AI (Magic)</label
      >
      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-300 w-52 text-neutral">
        <li><a @click="detectHandler">Detect Textbox</a></li>
        <li><a @click="ocrHandler">OCR</a></li>
        <div class="divider my-0"></div>
        <li><a>Translate</a></li>
        <!-- <div class="divider my-0"></div> -->
        <!-- <li><a>Segment & Mask</a></li> -->
        <!-- <li><a>Inpaint</a></li> -->
      </ul>
    </div>
    <div class="ml-auto mr-3">
      <div v-if="isIncubator" class="mt-1 hover:cursor-pointer">
        <div class="text-neutral-focus italic text-sm">Incubator Mode</div>
        <!-- <img class="h-[34px] w-[34px] object-cover rounded-full border hover:border-sky-100" src="/KyubeyMadokaMagica.png" /> -->
      </div>
    </div>
  </div>
</template>
