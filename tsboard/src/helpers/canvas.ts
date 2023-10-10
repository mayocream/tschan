import * as fabric from 'fabric'
import { Circle, Group, Object, Rect, Text, Textbox } from 'fabric'
import { useCanvas, useImages } from '../state'
import type { Layer, TextBox } from '../tschan'
import { uid } from '../libs/uid'
import { inferenceYoloDetection } from '../libs/inferenceOnnx'
import { orderTextBoxes } from '../libs/manga'
import { readFileAsBlob, restoreCanvasData, storeCanvasData } from '../libs/storage'
import { inferenceMangaOcrHuggingFace, inferenceComicTextDetectorPlusMangaOcr, isIncubatorAvailable } from '../libs/incubator'
import events from '../events'

const { makeBoundingBoxFromPoints } = fabric.util

const canvasState = useCanvas()
const imageState = useImages()

export function drawTextBox(box: TextBox, index: number) {
  const canvas = canvasState.canvas.value!
  const fontScaleRatio = Math.max(1, canvas.height / 1080)

  // TODO: combine 3 of them into one custom object
  const rect = new Rect({
    left: box.x1 * canvas.width,
    top: box.y1 * canvas.height,
    width: (box.x2 - box.x1) * canvas.width,
    height: (box.y2 - box.y1) * canvas.height,
    stroke: 'red',
    strokeWidth: 2 * fontScaleRatio,
    fill: 'transparent',
    opacity: 0.4,
    rx: 4 * fontScaleRatio,
    strokeUniform: true,
    cornerColor: 'rgba(0,0,0,0.5)',
    cornerStrokeColor: 'rgba(0,0,0,0.5)',
    borderColor: 'rgba(0,0,0,0.5)',
    cornerSize: 8 * fontScaleRatio,
  })

  const circle = new Circle({
    radius: 12 * fontScaleRatio,
    fill: 'red',
    left: rect.left,
    top: rect.top,
    originX: 'center',
    originY: 'center',
    opacity: 0.7,
  })

  const text = new Text(String(box.order), {
    fontSize: 16 * fontScaleRatio,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 'bold',
    fill: 'white',
    left: circle.left,
    top: circle.top,
    originX: 'center',
    originY: 'center',
    textAlign: 'center',
  })

  const group = new Group([rect, circle, text], {
    // allow to select rect
    subTargetCheck: true,
    // disable caching for this group
    objectCaching: false,
    interactive: false,
    hasBorders: false,
    hasControls: false,
    activeOn: 'down',
  })

  group.on({
    mouseup: () => {
      // set rect as active object
      canvas.setActiveObject(rect)
      // draw controls on active object
      canvas.drawControls(canvas.getContext())
    },
  })

  rect.on({
    scaling: () => {
      circle.set({ left: rect.left, top: rect.top })
      text.set({ left: rect.left, top: rect.top })
    },
    rotating: () => {
      circle.set({ left: rect.left, top: rect.top })
      text.set({ left: rect.left, top: rect.top })
    },
  })

  group.set('ts', <Layer>{
    id: uid(),
    type: 'textbox',
    name: box.text,
    index: index,
    textbox: box,
  })

  canvas.add(group)
}

export function orderTextBoxesByIndex() {
  const canvas = canvasState.canvas.value!
  const objects = canvas.getObjects()

  objects
    .filter((obj) => obj.get('ts')?.type == 'textbox')
    .sort((a, b) => a.get('ts')!.order - b.get('ts')!.order)
    .forEach((obj, i) => {
      const text = obj.item(2) as Text
      text.set('text', String(i + 1))
    })
}

export function moveTo(object: Object, index: number) {
  if (!object.isType('group')) return
  const group = object as Group
  const canvas = canvasState.canvas.value!

  canvas.moveObjectTo(group, index)

  const text = group.item(2) as Text
  text.set('text', String(group.get('ts')?.order))
}

export async function detectTextBoxes() {
  const blob = await readFileAsBlob(imageState.currentImage.value!)
  const boxes = await inferenceYoloDetection(blob)
  const orderedBoxes = orderTextBoxes(
    boxes.filter((box) => box[4] == 'frame'),
    boxes.filter((box) => box[4] == 'text')
  )
  for (const [i, box] of orderedBoxes.entries()) {
    drawTextBox({
      x1: box[0],
      y1: box[1],
      x2: box[2],
      y2: box[3],
      text: '',
      order: i + 1, // index starts from 1
      name: `Text...`,
      direction: 'vertical',
    }, i)
  }
}

export async function storeCanvas() {
  const canvas = canvasState.canvas.value!
  const objects = canvas.getObjects()
  const layers: Layer[] = []
  for (const object of objects) {
    const layer = object.get('ts') as Layer
    if (layer.type == 'textbox') {
      const group = object as Group
      const rect = group.item(0) as Rect
      // rect is relative to group
      // https://stackoverflow.com/questions/29829475/how-to-get-the-canvas-relative-position-of-an-object-that-is-in-a-group
      const bbox = {
        left: rect.left + rect.group!.left + rect.group!.width / 2,
        top: rect.top + rect.group!.top + rect.group!.height / 2,
        width: rect.width,
        height: rect.height,
      }
      const textbox: TextBox = {
        order: layer.index + 1,
        text: layer?.textbox?.text || '',
        x1: bbox.left / canvas.width,
        y1: bbox.top / canvas.height,
        x2: (bbox.left + bbox.width) / canvas.width,
        y2: (bbox.top + bbox.height) / canvas.height,
        direction: 'vertical',
      }

      layer.textbox = textbox
    }

    layers.push(layer)
  }

  if (layers.length == 0) return

  const data = JSON.stringify(layers)
  await storeCanvasData(imageState.currentImage.value!.name, data)

  console.log('store canvas data', layers)
}

export async function restoreCanvas() {
  const data = await restoreCanvasData(imageState.currentImage.value!.name)
  if (!data) {
    return false
  }

  const layers = JSON.parse(data)

  layers.sort((a: Layer, b: Layer) => a.index - b.index)

  if (layers.length == 0) return false

  for (const layer of layers) {
    if (layer.type == 'textbox') {
      console.log('restore textbox', layer)
      drawTextBox(layer.textbox!, layer.index)
    }
  }

  console.log('restore canvas data')
  return true
}

export async function ocr() {
  const image = imageState.currentImage.value!
  canvasState.canvas
    .value!.getObjects()
    .filter((obj) => obj.get('ts')?.type == 'textbox')
    .map((obj) => {
      const rect = (obj as Group).item(0) as Rect
      const rectBbox = rect.getBoundingRect(true)
      const bbox = [rectBbox.left, rectBbox.top, rectBbox.width, rectBbox.height]
      inferenceMangaOcrHuggingFace(image, bbox).then((text) => {
        const ts = obj.get('ts')
        ts.name = text
        ts.ocr_text = text
        obj.set('ts', ts)
        events.emit('canvas:ocr')
      })
    })
}

export async function detectAndOcr() {
  const currentImage = imageState.currentImage.value!
  const blob = await readFileAsBlob(currentImage)
  const { blks } = await inferenceComicTextDetectorPlusMangaOcr(blob)
  if (blks['blocks'].length == 0) return

  // if the current image is not the same as the image when the request was sent, ignore the result
  if (currentImage.name != imageState.currentImage.value!.name) return

  for (const [i, blk] of blks['blocks'].entries()) {
    drawTextBox({
      x1: blk.box[0] / 1024,
      y1: blk.box[1] / 1024,
      x2: blk.box[2] / 1024,
      y2: blk.box[3] / 1024,
      text: blk.lines.join('\n'),
      order: i + 1,
      direction: blk.vertical,
    }, i)
  }
}

export async function initialDetectAndOcr() {
  if (await isIncubatorAvailable) {
    await detectAndOcr()
  } else {
    await detectTextBoxes()
    await ocr()
  }
}
