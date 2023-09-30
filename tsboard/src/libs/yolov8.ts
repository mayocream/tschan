/**
 * Function used to convert RAW output from YOLOv8 to an array of detected objects.
 * Each object contain the bounding box of this object, the type of object and the probability
 * @param output Raw output of YOLOv8 network
 * @param img_width Width of original image
 * @param img_height Height of original image
 * @returns Array of detected objects in a format [[x1,y1,x2,y2,object_type,probability],..]
 */
export function process_output(output: any, img_width: number = 1, img_height: number = 1) {
  const boxes: any[] = []
  // yolov8 has an output of shape (batchSize, 5,  8400) (Num classes + box[x,y,w,h])
  for (let index = 0; index < 8400; index++) {
    const [class_id, prob] = [...Array(yolo_classes.length).keys()]
      .map((col) => [col, output[8400 * (col + 4) + index]])
      .reduce((accum, item) => (item[1] > accum[1] ? item : accum), [0, 0])
    // > 0.1 to filter out low probability
    if (prob < 0.1) {
      continue
    }
    const label = yolo_classes[class_id]
    const xc = output[index]
    const yc = output[8400 + index]
    const w = output[2 * 8400 + index]
    const h = output[3 * 8400 + index]
    const x1 = ((xc - w / 2) / 640) * img_width
    const y1 = ((yc - h / 2) / 640) * img_height
    const x2 = ((xc + w / 2) / 640) * img_width
    const y2 = ((yc + h / 2) / 640) * img_height
    boxes.push([x1, y1, x2, y2, label, prob])
  }

  return nms(boxes)
}

export function process_output_v5(output: any, img_width: number = 1, img_height: number = 1) {
  const boxes: any[] = []
  for (let i = 0; i < output.length; i += 7) {
    let label, prob

    if (output[i + 4] > output[i + 5] && output[i + 4] > output[i + 6]) {
      label = '1'
      prob = output[i + 4]
    } else if (output[i + 5] > output[i + 4] && output[i + 5] > output[i + 6]) {
      label = '2'
      prob = output[i + 5]
    } else {
      label = '3'
      prob = output[i + 6]
    }

    if (prob < 0.9) continue

    const xc = output[i]
    const yc = output[i + 1]
    const w = output[i + 2]
    const h = output[i + 3]
    const x1 = ((xc - w / 2) / 1024) * img_width
    const y1 = ((yc - h / 2) / 1024) * img_height
    const x2 = ((xc + w / 2) / 1024) * img_width
    const y2 = ((yc + h / 2) / 1024) * img_height

    boxes.push([x1, y1, x2, y2, label, prob])
  }

  return nms(boxes)
}

function overlaps(boxA: any[], boxB: any[]): boolean {
  return !(boxA[2] < boxB[0] || boxA[0] > boxB[2] || boxA[3] < boxB[1] || boxA[1] > boxB[3])
}

function nms(boxes: any[]): any[] {
  const sortedIndices = boxes.map((_, index) => index).sort((a, b) => boxes[b][4] - boxes[a][4]) // Sort by score

  const filteredBoxes: any[] = []

  while (sortedIndices.length > 0) {
    const currentIndex = sortedIndices.shift()!
    const currentBox = boxes[currentIndex]
    filteredBoxes.push(currentBox)

    for (let i = sortedIndices.length - 1; i >= 0; i--) {
      if (overlaps(currentBox, boxes[sortedIndices[i]])) {
        sortedIndices.splice(i, 1)
      }
    }
  }

  return filteredBoxes
}
/**
 * Function calculates "Intersection-over-union" coefficient for specified two boxes
 * https://pyimagesearch.com/2016/11/07/intersection-over-union-iou-for-object-detection/.
 * @param box1 First box in format: [x1,y1,x2,y2,object_class,probability]
 * @param box2 Second box in format: [x1,y1,x2,y2,object_class,probability]
 * @returns Intersection over union ratio as a float number
 */
function iou(box1: any[], box2: any[]) {
  return intersection(box1, box2) / union(box1, box2)
}

/**
 * Function calculates union area of two boxes.
 *     :param box1: First box in format [x1,y1,x2,y2,object_class,probability]
 *     :param box2: Second box in format [x1,y1,x2,y2,object_class,probability]
 *     :return: Area of the boxes union as a float number
 * @param box1 First box in format [x1,y1,x2,y2,object_class,probability]
 * @param box2 Second box in format [x1,y1,x2,y2,object_class,probability]
 * @returns Area of the boxes union as a float number
 */
function union(box1: any[], box2: any[]) {
  const [box1_x1, box1_y1, box1_x2, box1_y2] = box1
  const [box2_x1, box2_y1, box2_x2, box2_y2] = box2
  const box1_area = (box1_x2 - box1_x1) * (box1_y2 - box1_y1)
  const box2_area = (box2_x2 - box2_x1) * (box2_y2 - box2_y1)
  return box1_area + box2_area - intersection(box1, box2)
}

/**
 * Function calculates intersection area of two boxes
 * @param box1 First box in format [x1,y1,x2,y2,object_class,probability]
 * @param box2 Second box in format [x1,y1,x2,y2,object_class,probability]
 * @returns Area of intersection of the boxes as a float number
 */
function intersection(box1: any[], box2: any[]) {
  const [box1_x1, box1_y1, box1_x2, box1_y2] = box1
  const [box2_x1, box2_y1, box2_x2, box2_y2] = box2
  const x1 = Math.max(box1_x1, box2_x1)
  const y1 = Math.max(box1_y1, box2_y1)
  const x2 = Math.min(box1_x2, box2_x2)
  const y2 = Math.min(box1_y2, box2_y2)
  return (x2 - x1) * (y2 - y1)
}

/**
 * Array of YOLOv8 class labels
 */
const yolo_classes = ['text']
