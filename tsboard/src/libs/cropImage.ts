// ref: https://stackoverflow.com/questions/26015497/how-to-resize-then-crop-an-image-with-canvas
export async function cropImage(blob: Blob, bbox: number[]): Promise<Blob> {
  const imageBitmap = await createImageBitmap(blob)
  // Create offscreen canvas
  const offscreenCanvas = new OffscreenCanvas(bbox[2], bbox[3])
  const ctx = offscreenCanvas.getContext('2d')

  // Draw and resize
  ctx!.drawImage(imageBitmap, bbox[0], bbox[1], bbox[2], bbox[3], 0, 0, bbox[2], bbox[3])

  // Convert canvas to blob
  const resizedBlob = await offscreenCanvas.convertToBlob()

  return resizedBlob
}
