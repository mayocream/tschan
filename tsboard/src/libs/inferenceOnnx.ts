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
  // var imageTensor = imageDataToTensor(image, dims)
  // 3. return the tensor
  return imageTensor
}

const imageDataToTensor = (image: ImageData, dims: number[]): Tensor => {
  // 1. Get buffer data from image and create R, G, and B arrays.
  const imageBufferData = image.data
  const [redArray, greenArray, blueArray] = [<number[]>[], <number[]>[], <number[]>[]]

  // 2. Loop through the image buffer and extract the R, G, and B channels
  for (let i = 0; i < imageBufferData.length; i += 4) {
    redArray.push(imageBufferData[i])
    greenArray.push(imageBufferData[i + 1])
    blueArray.push(imageBufferData[i + 2])
    // skip data[i + 3] to filter out the alpha channel
  }

  // 3. Concatenate RGB to transpose [224, 224, 3] -> [3, 224, 224] to a number array
  const transposedData = redArray.concat(greenArray).concat(blueArray)

  // 4. convert to float32
  let i,
    l = transposedData.length // length, we need this for the loop
  // create the Float32Array size 3 * 224 * 224 for these dimensions output
  const float32Data = new Float32Array(dims[1] * dims[2] * dims[3])
  for (i = 0; i < l; i++) {
    float32Data[i] = transposedData[i] / 255.0 // convert to float
  }
  // 5. create the tensor object from onnxruntime-web.
  const inputTensor = new Tensor('float32', float32Data, dims)
  return inputTensor
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
  //Get the softmax of the output data. The softmax transforms values to be between 0 and 1
  //   var outputSoftmax = softmax(Array.prototype.slice.call(output.data))
  //Get the top 5 results.
  //   var results = imagenetClassesTopK(outputSoftmax, 5)
  console.log('output: ', outputData, 'inference time: ', inferenceTime, 's')


  console.log('outputData: ', outputData['output0'].reshape([5, 8400]))

  // test
  const boxes = process_output(output.data)

  console.log('boxes: ', boxes)

  return [boxes, inferenceTime]
}
