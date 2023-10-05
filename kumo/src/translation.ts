import { json } from 'itty-router'
import { KumoRequest } from './kumo'

async function workersAI(token: string, model: string, input: any): Promise<any> {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/2d277d7ebdb15ece826c10f62e79da7a/ai/run/${model}`, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(input),
  })
  const result = await response.json()
  return result
}

export default async function (request: KumoRequest, env: Env, ctx: ExecutionContext): Promise<Response> {
  const { texts }: { texts: string[] | null } = await request.json()
  if (!texts) {
    return json({ error: 'text required' }, { status: 400 })
  }

  // TODO: support LLM model, which needs per/post-processing texts

  // seq2seq model, lower quality, but faster, and higher requests
  // https://developers.cloudflare.com/workers-ai/models/translation/
  const responses = await Promise.all(
    texts.map((text) => {
      return workersAI(env.WORKERS_AI_TOKEN, '@cf/meta/m2m100-1.2b', {
        text,
        source_lang: 'japanese',
        target_lang: 'chinese',
      }).then((output) => output?.result?.translated_text)
    })
  )

  return json(responses)
}
