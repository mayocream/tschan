import { Box } from './yolov8'

interface Cluster {
  boxes: Box[]
  centroid: [number, number]
  frame: Box
}

export function orderTextBoxes(frames: Box[], texts: Box[]): Box[] {
  // Helper function to compute the centroid of a box
  function centroid(box: Box): [number, number] {
    return [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2]
  }

  // Helper function to compute distance between two box centroids
  function distance(box1: Box, box2: Box): number {
    const [c1x, c1y] = centroid(box1)
    const [c2x, c2y] = centroid(box2)
    const dx = c1x - c2x
    const dy = c1y - c2y
    return Math.sqrt(dx * dx + dy * dy)
  }

  function contains(box1: Box, box2: Box): boolean {
    const [c2x, c2y] = centroid(box2)
    return box1[0] <= c2x && c2x <= box1[2] && box1[1] <= c2y && c2y <= box1[3]
  }

  // Helper function to compute the width of a box
  function width(box: Box): number {
    return box[2] - box[0]
  }

  const clusters: Cluster[] = frames.map((frame) => ({
    boxes: [],
    centroid: centroid(frame),
    frame,
  }))

  for (const text of texts) {
    const clustersOrderbyDistance = clusters.sort((a, b) => distance(a.frame, text) - distance(b.frame, text))
    let textInFrame = false
    for (const cluster of clustersOrderbyDistance) {
      if (contains(cluster.frame, text)) {
        cluster.boxes.push(text)
        textInFrame = true
        break
      }
    }

    if (!textInFrame) {
      const cluster = clustersOrderbyDistance[0] || {
        boxes: [],
        centroid: centroid(text),
      }
      cluster.boxes.push(text)
    }
  }

  clusters.forEach((cluster) => {
    cluster.boxes.sort((a, b) => b[0] - a[0])
  })
  clusters.sort((a, b) => a.centroid[1] - b.centroid[1])

  return clusters.map((cluster) => cluster.boxes).flat()
}
