import { InferenceSession, Tensor } from 'onnxruntime-web'
import { resizeImageData } from './resizeImage'
import { process_output } from './yolov8'

export async function inferenceYolo(url: string): Promise<[any, number]> {
  // 1. Convert image to tensor
  const imageTensor = await getImageTensorFromUrl(url)
  // 2. Run model
  const [predictions, inferenceTime] = await runYoloModel(imageTensor)
  // 3. Return predictions and the amount of time it took to inference.
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
  console.log('Inference session created')
  // Run inference and get results.
  var [results, inferenceTime] = await runInference(session, preprocessedData)
  return [results, inferenceTime]
}

const runInference = async (session: InferenceSession, preprocessedData: any): Promise<[any, number]> => {
  // Get start time to calculate inference time.
  const start = new Date()
  // create feeds with the input name from model export and the preprocessed data.
  const feeds: Record<string, Tensor> = {}
  feeds[session.inputNames[0]] = preprocessedData
  // Run the session inference.
  const outputData = await session.run(feeds)
  // Get the end time to calculate inference time.
  const end = new Date()
  // Convert to seconds.
  const inferenceTime = (end.getTime() - start.getTime()) / 1000
  // Get output results with the output name from the model export.
  const output = outputData[session.outputNames[0]]

  const boxes = process_output(output.data)
  return [boxes, inferenceTime]
}
