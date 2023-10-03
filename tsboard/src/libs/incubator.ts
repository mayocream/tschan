import { cropImage } from './cropImage'

// @ts-ignore
const INCUBATOR_PORT = window.INCUBATOR_PORT ?? 43101
// @ts-ignore
const INCUBATOR_URL = window.INCUBATOR_URL ?? `http://localhost:${INCUBATOR_PORT}`

export const inferenceMangaOcr = async (imageSrc: string, bbox: number[]): Promise<string> => {
  const blob = await cropImage(imageSrc, bbox)
  const formData = new FormData()
  formData.append('image', blob, `${Math.floor(bbox[0])}-${Math.floor(bbox[1])}-${Math.floor(bbox[2])}-${Math.floor(bbox[3])}.png`)

  const startTime = Date.now()

  const response = await fetch(`${INCUBATOR_URL}/inference/manga-ocr`, {
    method: 'POST',
    body: formData,
  })

  const endTime = Date.now()

  const data = await response.json()
  console.log('inferenceMangaOcr: ', data, `(${endTime - startTime} ms)`)
  return data
}
