import { Circle, Group, Object, Rect, Text } from 'fabric'
import { useCanvas, useImages } from '../state'
import type { Layer, TextBox } from '../tschan'
import { uid } from '../libs/uid'
import { inferenceYoloDetection } from '../libs/inferenceOnnx'
import { orderTextBoxes } from '../libs/manga'
import { readFileAsBlob, restoreCanvasData, storeCanvasData } from '../libs/storage'
import { inferenceMangaOcr, inferenceComicTextDetector, isIncubatorAvailable } from '../libs/incubator'
import events from '../events'

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
    // TODO: support rotation, this requires store/restore rotation
    lockRotation: true,
    objectCaching: false,
  })

  const circle = new Circle({
    radius: 12 * fontScaleRatio,
    fill: 'red',
    left: rect.left,
    top: rect.top,
    originX: 'center',
    originY: 'center',
    opacity: 0.7,
    interactive: false,
    selectable: false,
  })

  const indicator = new Text(String(box.order), {
    fontSize: 16 * fontScaleRatio,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 'bold',
    fill: 'white',
    left: circle.left,
    top: circle.top,
    originX: 'center',
    originY: 'center',
    textAlign: 'center',
    interactive: false,
    selectable: false,
  })

  const group = new Group([rect, circle, indicator], {
    // allow to select rect
    subTargetCheck: true,
    // disable caching for this group
    objectCaching: false,
    // Used to allow targeting of object inside groups.
    // set to true if you want to select an object inside a group.\
    // **REQUIRES** `subTargetCheck` set to true
    interactive: true,
    hasBorders: false,
    hasControls: false,
    activeOn: 'down',
  })

  group.on({
    selected: () => {
      // set rect as active object
      canvas.setActiveObject(rect)
      // draw controls on active object
      canvas.drawControls(canvas.getContext())
    }
  })

  rect.on({
    scaling: () => {
      circle.set({ left: rect.left, top: rect.top })
      indicator.set({ left: rect.left, top: rect.top })
      // https://stackoverflow.com/questions/31885781/fabricjs-using-object-controls-on-canvas-to-resize-but-not-scale
      rect.set({
        width: rect.width * rect.scaleX,
        height: rect.height * rect.scaleY,
        scaleX: 1,
        scaleY: 1,
      })
    },
    rotating: () => {
      circle.set({ left: rect.left, top: rect.top })
      indicator.set({ left: rect.left, top: rect.top })
    },
    moving: () => {
      circle.set({ left: rect.left, top: rect.top })
      indicator.set({ left: rect.left, top: rect.top })
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
  const textBoxes = objects.filter((obj) => obj.get('ts')?.type == 'textbox')
  for (const [i, textBox] of textBoxes.entries()) {
    const layer = textBox.get('ts') as Layer
    layer.index = i
    layer.textbox!.order = i + 1
    textBox.set('ts', layer)
    const group = textBox as Group
    const text = group.item(2) as Text
    text.set({ text: String(layer.index + 1) })
    text.dirty = true
  }
  canvas.renderAll()
}

export function moveTo(object: Object, index: number) {
  const canvas = canvasState.canvas.value!
  canvas.moveObjectTo(object, index)
  console.log(canvas.getObjects())
  orderTextBoxesByIndex()
  canvas.renderAll()
}

export function remove(object: Object) {
  const canvas = canvasState.canvas.value!
  canvas.remove(object)
  orderTextBoxesByIndex()
  canvas.renderAll()
}

export async function detectTextBoxesYolo() {
  console.log('detectTextBoxesYolo')
  const blob = await readFileAsBlob(imageState.currentImage.value!)
  const boxes = await inferenceYoloDetection(blob)
  const orderedBoxes = orderTextBoxes(
    boxes.filter((box) => box[4] == 'frame'),
    boxes.filter((box) => box[4] == 'text')
  )
  for (const [i, box] of orderedBoxes.entries()) {
    drawTextBox(
      {
        x1: box[0],
        y1: box[1],
        x2: box[2],
        y2: box[3],
        text: '',
        order: i + 1, // index starts from 1
        direction: 'vertical',
      },
      i
    )
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

  // console.log('store canvas data', layers)
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
      // console.log('restore textbox', layer)
      drawTextBox(layer.textbox!, layer.index)
    }
  }

  console.log('restore canvas data', layers)
  return true
}

export async function ocr() {
  const image = imageState.currentImage.value!
  const blob = await readFileAsBlob(image)
  const objects = canvasState.canvas.value!.getObjects().filter((obj) => obj.get('ts')?.type == 'textbox')

  const promises = []

  for (const obj of objects) {
    const layer = obj.get('ts') as Layer
    const bbox = extractBBox(obj)

    const promise = inferenceMangaOcr(blob, [bbox.left, bbox.top, bbox.width, bbox.height]).then((text) => {
      layer.textbox!.text = text
      layer.name = text
      obj.set('ts', layer)
      events.emit('canvas:ocr')
    })

    promises.push(promise)
  }

  await Promise.all(promises)
  await storeCanvas()
}

export async function detectTextBoxes() {
  const currentImage = imageState.currentImage.value!
  const blob = await readFileAsBlob(currentImage)
  const { blks } = await inferenceComicTextDetector(blob)
  if (blks['blocks'].length == 0) return

  // if the current image is not the same as the image when the request was sent, ignore the result
  if (currentImage.name != imageState.currentImage.value!.name) return

  const canvas = canvasState.canvas.value!

  for (const [i, blk] of blks['blocks'].entries()) {
    drawTextBox(
      {
        x1: blk.box[0] / canvas.width,
        y1: blk.box[1] / canvas.height,
        x2: blk.box[2] / canvas.width,
        y2: blk.box[3] / canvas.height,
        order: i + 1,
        direction: blk.vertical,
      },
      i
    )
  }

  await storeCanvas()
}

export async function initialDetectAndOcr() {
  console.log('initialDetectAndOcr')
  if (await isIncubatorAvailable) {
    console.log('use incubator')
    await detectTextBoxes()
    await ocr()
  } else {
    await detectTextBoxesYolo()
  }
  await storeCanvas()
  canvasState.canvas.value!.renderAll()
}

const extractBBox = (obj: Object) => {
  const rect = (obj as Group).item(0) as Rect
  const bbox = {
    left: rect.left + rect.group!.left + rect.group!.width / 2,
    top: rect.top + rect.group!.top + rect.group!.height / 2,
    width: rect.width,
    height: rect.height,
  }
  return bbox
}
