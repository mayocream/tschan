import { KumoRequest } from './kumo'

export default async function (request: KumoRequest, env: Env, ctx: ExecutionContext): Promise<Response> {
  const contentType = request.headers.get('content-type')
  if (!contentType || !contentType.startsWith('image/')) {
    return new Response(JSON.stringify({ error: 'image required' }), { status: 400 })
  }

  const image = request.body

  const authorization = {
    authorization: `Bearer ${env.HUGGING_FACE_API_TOKEN}`,
  }

  // TODO: requires login?

  const response = await fetch('https://api-inference.huggingface.co/models/kha-white/manga-ocr-base', {
    method: 'POST',
    body: image,
    headers: {
      accept: 'application/json',
      'content-type': contentType,
      ...authorization,
    },
  })

  return new Response(response.body, {
    headers: {
      'content-type': 'application/json',
    },
  })
}
