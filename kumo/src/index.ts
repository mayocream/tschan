import { error, Router, createCors, type RouteHandler, json } from 'itty-router'
import OAuthGitHub from './oauth/github'
import type { KumoRequest } from './kumo'
import { authorization } from './auth'
import translation from './translation'
import ocr from './ocr'

const { preflight, corsify } = createCors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  headers: {
    'Access-Control-Allow-Headers': 'Content-Type',
  },
})
const router = Router()

router
  .all('*', preflight, authorization as RouteHandler)
  .get('/user', (request) => json({ user: request.user, role: request.role }))
  .all('/oauth/github', OAuthGitHub)
  .all('/translate', translation)
  .all('/ocr', ocr)
  .all('*', () => error(404))

export default {
  fetch: (request: KumoRequest, env: Env, ctx: ExecutionContext): Promise<Response> =>
    router.handle(request, env, ctx).then(corsify).catch(error),
}
