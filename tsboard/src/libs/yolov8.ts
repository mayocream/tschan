export type Box = [number, number, number, number, string, number]

export function processOutput(data: Float32Array): Box[] {
  let boxes: Box[] = []
  const numOfClasses = yolo_classes.length
  const threshold = 0.1
  const imageSize = 640
  const padding = 5

  for (let index = 0; index < 8400; index++) {
    let maxProb = 0
    let maxClassId = 0

    // Find class with the highest probability
    for (let classId = 0; classId < numOfClasses; classId++) {
      const prob = data[8400 * (classId + 4) + index]
      if (prob > maxProb) {
        maxProb = prob
        maxClassId = classId
      }
    }

    // Filter out low probability
    if (maxProb < threshold) {
      continue
    }

    const label = yolo_classes[maxClassId]

    const xc = data[index]
    const yc = data[8400 + index]
    const w = data[2 * 8400 + index]
    const h = data[3 * 8400 + index]

    const x1 = xc - w / 2
    const y1 = yc - h / 2
    const x2 = xc + w / 2
    const y2 = yc + h / 2

    boxes.push([x1, y1, x2, y2, label, maxProb])
  }

  boxes = softNms(boxes)
  for (const box of boxes) {
    box[0] = (box[0] - padding) / imageSize
    box[1] = (box[1] - padding) / imageSize
    box[2] = (box[2] + padding) / imageSize
    box[3] = (box[3] + padding) / imageSize
  }

  return boxes
}

function iou(boxA: Box, boxB: Box): number {
  const interX1 = Math.max(boxA[0], boxB[0])
  const interY1 = Math.max(boxA[1], boxB[1])
  const interX2 = Math.min(boxA[2], boxB[2])
  const interY2 = Math.min(boxA[3], boxB[3])

  const interArea = Math.max(0, interX2 - interX1 + 1) * Math.max(0, interY2 - interY1 + 1)
  const boxAArea = (boxA[2] - boxA[0] + 1) * (boxA[3] - boxA[1] + 1)
  const boxBArea = (boxB[2] - boxB[0] + 1) * (boxB[3] - boxB[1] + 1)

  return interArea / (boxAArea + boxBArea - interArea)
}

function softNms(detections: Box[], sigma: number = 0.5, threshold: number = 0.4): Box[] {
  const groupedByClass: { [key: string]: Box[] } = {}
  for (const detection of detections) {
    const label = detection[4]
    if (!groupedByClass[label]) {
      groupedByClass[label] = []
    }
    groupedByClass[label].push(detection)
  }

  const result: Box[] = []
  for (const label in groupedByClass) {
    const classDetections = groupedByClass[label]
    classDetections.sort((a, b) => b[5] - a[5]) // Sort detections by descending score

    while (classDetections.length) {
      const maxDet = classDetections[0] // After sorting, the highest scoring detection is at index 0

      if (maxDet[5] < threshold) {
        classDetections.shift() // Remove from list and continue
        continue
      }

      for (let j = 1; j < classDetections.length; ) {
        const currDet = classDetections[j]
        const overlap = iou(maxDet, currDet)

        if (overlap > threshold) {
          const weight = Math.exp(-(overlap ** 2) / sigma)
          currDet[5] *= weight // decay the score

          if (currDet[5] < threshold) {
            classDetections.splice(j, 1)
            continue
          }
        }
        j++
      }

      result.push(maxDet)
      classDetections.shift() // Remove the maxDet from the list
    }
  }

  return result
}

/**
 * Array of YOLOv8 class labels
 */
const yolo_classes = ['frame', 'text']
