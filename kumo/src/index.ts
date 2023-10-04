import { error, Router, createCors } from 'itty-router'
import OAuthGitHub from './oauth/github'

const { preflight, corsify } = createCors()
const router = Router()

router
  .all('*', preflight)
  .all('/oauth/github', OAuthGitHub)
  .all('*', () => error(404))

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> =>
    router.handle(request, env, ctx).then(corsify).catch(error),
}
