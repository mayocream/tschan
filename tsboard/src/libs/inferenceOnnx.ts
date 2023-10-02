import { InferenceSession, Tensor } from 'onnxruntime-web'
import { resizeImageData } from './resizeImage'
import { Box, processOutput } from './yolov8'

const Yolov8Session = await InferenceSession.create('/models/yolov8n.onnx')

export async function inferenceYoloDetection(url: string): Promise<Box[]> {
  const imageTensor = await getImageTensorFromUrl(url)
  const [predictions, inferenceTime] = await runYoloModel(imageTensor)

  const start = new Date()
  const boxes = processOutput(predictions)
  const end = new Date()
  const nmsTime = end.getTime() - start.getTime()

  console.log(`Inference Yolo Detection, boxes:`, boxes, `, model time: ${inferenceTime} ms, NMS time: ${nmsTime} ms`)

  return boxes
}

const getImageTensorFromUrl = async (url: string, dims: number[] = [1, 3, 640, 640]): Promise<Tensor> => {
  const image = await resizeImageData(url, dims[2], dims[3])
  const imageTensor = await Tensor.fromImage(image)
  return imageTensor
}

const runYoloModel = async (preprocessedData: any): Promise<[Float32Array, number]> => {
  // Create session and set options. See the docs here for more options:
  //https://onnxruntime.ai/docs/api/js/interfaces/InferenceSession.SessionOptions.html#graphOptimizationLevel
  const session = Yolov8Session
  const [output, inferenceTime] = await runInference(session, preprocessedData)
  const results = output[session.outputNames[0]].data as Float32Array
  return [results, inferenceTime]
}

const runInference = async (
  session: InferenceSession,
  preprocessedData: any
): Promise<[InferenceSession.ReturnType, number]> => {
  const start = new Date()
  const feeds: Record<string, Tensor> = {}
  feeds[session.inputNames[0]] = preprocessedData
  const output = await session.run(feeds)
  const end = new Date()
  const inferenceTime = end.getTime() - start.getTime()

  return [output, inferenceTime]
}
