import { error, Router, createCors, type RouteHandler } from 'itty-router'
import OAuthGitHub from './oauth/github'
import type { KumoRequest } from './kumo'
import { authorization } from './lib/auth'

const { preflight, corsify } = createCors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  headers: {
    'Access-Control-Allow-Headers': 'Content-Type',
  },
})
const router = Router()

router
  .all('*', preflight, authorization as RouteHandler)
  .get('/user', (request) => new Response(JSON.stringify({ user: request.user, role: request.role })))
  .all('/oauth/github', OAuthGitHub)
  .all('*', () => error(404))

export default {
  fetch: (request: KumoRequest, env: Env, ctx: ExecutionContext): Promise<Response> =>
    router.handle(request, env, ctx).then(corsify).catch(error),
}
