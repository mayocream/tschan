import { InferenceSession, Tensor } from 'onnxruntime-web'
import { resizeImageData } from './resizeImage'
import { process_output, process_output_v5 } from './yolov8'

export async function inferenceYolo(url: string): Promise<[any, number]> {
  const imageTensor = await getImageTensorFromUrl(url)
  const [predictions, inferenceTime] = await runYoloModel(imageTensor)
  return [predictions, inferenceTime]
}

export async function inferenceTextDetector(url: string): Promise<[any, number]> {
  const imageTensor = await getImageTensorFromUrl(url, [1, 3, 1024, 1024])
  const [predictions, inferenceTime] = await runComicTextDetectorModel(imageTensor)

  console.log('inferenceTextDetector: ', predictions, inferenceTime)

  return [predictions, inferenceTime]
}

const getImageTensorFromUrl = async (url: string, dims: number[] = [1, 3, 640, 640]): Promise<Tensor> => {
  // 1. load the image
  const image = await resizeImageData(url, dims[2], dims[3])
  // 2. convert to tensor
  const imageTensor = await Tensor.fromImage(image)
  // 3. return the tensor
  return imageTensor
}

const runYoloModel = async (preprocessedData: any): Promise<[any, number]> => {
  // Create session and set options. See the docs here for more options:
  //https://onnxruntime.ai/docs/api/js/interfaces/InferenceSession.SessionOptions.html#graphOptimizationLevel
  const session = await InferenceSession.create('/models/best.onnx')
  const [output, inferenceTime] = await runInference(session, preprocessedData)
  const results = output[session.outputNames[0]]
  const boxes = process_output(results.data)
  return [boxes, inferenceTime]
}

const runComicTextDetectorModel = async (preprocessedData: any): Promise<[any, number]> => {
  const session = await InferenceSession.create('/models/comictextdetector.pt.onnx')
  const [output, inferenceTime] = await runInference(session, preprocessedData)

  console.log('runComicTextDetectorModel: ', output, inferenceTime)

  const blks = output[session.outputNames[0]]
  const boxes = process_output_v5(blks.data)
  console.log('commic text detector: ', boxes)

  return [boxes, inferenceTime]
}

const runInference = async (session: InferenceSession, preprocessedData: any): Promise<[any, number]> => {
  // Get start time to calculate inference time.
  const start = new Date()
  // create feeds with the input name from model export and the preprocessed data.
  const feeds: Record<string, Tensor> = {}
  feeds[session.inputNames[0]] = preprocessedData
  // Run the session inference.
  const output = await session.run(feeds)
  // Get the end time to calculate inference time.
  const end = new Date()
  // Convert to seconds.
  const inferenceTime = (end.getTime() - start.getTime()) / 1000

  return [output, inferenceTime]
}
