<script setup lang="ts">
import { onMounted } from 'vue'
import resizeImage from '../libs/resizeImage'
import { useImagesStore } from '../store'

const imagesStore = useImagesStore()

const emptyImage =
  'data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII='

// mock image list
const imageList = Array.from({ length: 131 }, (_, i) => {
  return {
    id: i,
    name: `${i + 1}`,
    url: `/samples/images/${i + 1}.jpg`,
  }
})

imagesStore.list = imageList.map((image) => image.url)

const lazyLoadImages = async () => {
  const images = [].slice.call(document.querySelectorAll('img.lazy'))

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(async (entry) => {
      if (entry.isIntersecting) {
        const image = entry.target as HTMLImageElement
        const blob = await resizeImage(image.dataset.src!, 96, 128)
        image.src = URL.createObjectURL(blob)
        image.classList.remove('lazy')
        observer.unobserve(image)
      }
    })
  })

  images.forEach((image) => {
    observer.observe(image)
  })
}

onMounted(async () => {
  lazyLoadImages()
})
</script>

<template>
  <aside class="min-w-[6rem] w-[13rem] overflow-auto h-full">
    <div class="flex flex-row flex-wrap justify-stretch my-2 gap-y-2">
      <figure
        v-for="image in imageList"
        @click="imagesStore.setCurrent(image.id)"
        :key="image.id"
        :data-active="image.id == imagesStore.current"
        class="w-24 h-34 m-auto opacity-70 hover:opacity-100 relative box-border data-[active=true]:opacity-100 data-[active=true]:border-2 data-[active=true]:border-blue-500"
      >
        <img draggable="false" :src="emptyImage" :alt="image.name" :data-src="image.url" class="w-24 h-32 object-scale-down lazy" />
        <figcaption
          class="text-[.8rem] truncate select-none text-center text-sm absolute bottom-0 w-full bg-[rgba(0,0,0,0.7)] text-white"
        >
          {{ image.name }}
        </figcaption>
      </figure>
    </div>
  </aside>
</template>
