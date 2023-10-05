// ref https://docs.github.com/en/apps/creating-github-apps/writing-code-for-a-github-app/building-a-login-with-github-button-with-a-github-app
// ref https://github.com/gr2m/cloudflare-worker-github-oauth-login

import jwt from '@tsndr/cloudflare-worker-jwt'
import type { UserMetadata } from '../kumo'
import { KumoUserAgent } from '../kumo'
import ulid from '../lib/ulid'
import { parse } from 'cookie'

/**
 * Route: /oauth/github
 * GET: redirect to GitHub OAuth login page
 * GET + code:
 * 1. exchange code for access token
 * 2. get user info
 * 3. store user info in KV
 * 4. generate JWT
 * 5. redirect to `redirect_uri`
 */
export default async function (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	if (request.method != 'GET') {
		return new Response(null, { status: 405 })
	}

  // redirect GET requests to the OAuth login page on github.com
  // debug: http://127.0.0.1:8787/oauth/github?redirect_uri=http://127.0.0.1:8787/user
  if (!request.url.includes('code')) {
    const redirect_uri = new URL(request.url).searchParams.get('redirect_uri') ?? request.headers.get('referer') ?? '/'
    const callback_uri = request.url.split('?')[0]
    return new Response(null, {
      headers: {
        'set-cookie': `kumo-redirect=${redirect_uri}; HttpOnly; Path=/; Max-Age=60`,
        location: `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${callback_uri}`,
      },
      status: 302,
    })
  }

  // login after user approves access
  const code = new URL(request.url).searchParams.get('code')

  // 1. exchange code for access token
  // const { code } = await request.json<any>()
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'user-agent': KumoUserAgent,
    },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code }),
  })
  if (!response.ok) {
    console.log('user failed to login to github: ', await response.text())
    return new Response(JSON.stringify({ error: 'login to github' }), { status: 401 })
  }

  const result = await response.json<any>()

  // 2. get user info
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${result.access_token}`,
      // https://docs.github.com/en/rest/overview/resources-in-the-rest-api?apiVersion=2022-11-28#user-agent-required
      'user-agent': KumoUserAgent,
    },
  })
  if (!userResponse.ok) {
    console.log('failed to get user info from github: ', await userResponse.text())
    return new Response(JSON.stringify({ error: 'failed to get user info from github' }), { status: 401 })
  }

  const userInfo = await userResponse.json<any>()

  // 3. store user info in KV

  // 3.1) create or update user
  let { metadata }: { metadata: UserMetadata | null } = await env.KV.getWithMetadata(`oauth:github:${userInfo.id}`)
  console.log(`user ${userInfo.name} (${userInfo.login}) logged in with github`, { new: !metadata, email: userInfo.email })

  const id = metadata?.ulid ?? ulid()
  metadata = {
    ...metadata,
    ...{
      ulid: id,
      name: userInfo.name,
      username: userInfo.login,
      avatar: userInfo.avatar_url,
      email: userInfo.email,
      updated_at: new Date().toISOString(),
      created_at: metadata?.created_at ?? new Date().toISOString(),
    },
  }

  // BUG? https://github.com/cloudflare/miniflare/issues/703
  await env.KV.put(`user:${id}`, 'x', { metadata })

  // 3.2) oauth <-> user mapping
  await env.KV.put(`oauth:github:${userInfo.id}`, JSON.stringify(userInfo), { metadata })

  // 4. generate JWT
  const token = await jwt.sign({ ...metadata }, env.JWT_SECRET)

  // 4.x) set a magical client-read-only cookie for cross-domain access
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#schemeful_same-site
  // the client needs to use the token in HTTP header `Authorization: Bearer ${token}`
  const domain =
    request.url.includes('127.0.0.1') || request.url.includes('::1')
      ? new URL(request.url).hostname
      : new URL(request.url).hostname.split('.').slice(-2).join('.')

  // 5. redirect to `redirect_uri`
  return new Response(null, {
    headers: {
      'set-cookie': `kumo-token=${token}; Domain=.${domain}; Path=/; SameSite=Strict; Max-Age=604800`,
      location: request.headers.get('cookie') ? parse(request.headers.get('cookie')!)['kumo-redirect'] : '/',
    },
    status: 302,
  })
}
