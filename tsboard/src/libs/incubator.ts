import { cropImage } from './cropImage'

// @ts-ignore
const INCUBATOR_URL = window.INCUBATOR_URL ?? `http://localhost:43101`

export const inferenceMangaOcr = async (imageSrc: string, bbox: number[]): Promise<string> => {
  const blob = await cropImage(imageSrc, bbox)
  const startTime = Date.now()

  const response = await fetch(`${INCUBATOR_URL}/inference/manga-ocr`, {
    method: 'POST',
    body: blob,
    headers: {
      'content-type': 'image/png',
    },
  })

  const endTime = Date.now()

  const data = await response.json()
  console.log('inferenceMangaOcr: ', data, `(${endTime - startTime} ms)`)
  return data
}

export const inferenceMangaOcrHuggingFace = async (imageSrc: string, bbox: number[]): Promise<string> => {
  const blob = await cropImage(imageSrc, bbox)
  const startTime = Date.now()

  const response = await fetch('https://api-inference.huggingface.co/models/kha-white/manga-ocr-base', {
    method: 'POST',
    body: blob,
    headers: {
      'content-type': 'image/png',
    },
  })

  const endTime = Date.now()

  const data = await response.json()
  console.log('inferenceMangaOcr: ', data, `(${endTime - startTime} ms)`)
  return data
}
