import jwt from '@tsndr/cloudflare-worker-jwt'
import { parse } from 'cookie'
import { Roles, type KumoRequest, type UserMetadata, type RoleType } from './kumo'
import type { RouteHandler } from 'itty-router'

export async function authorization(request: KumoRequest, env: Env, ctx: ExecutionContext) {
  let token
  if ((token = request.headers.get('authorization'))) {
    token = token.substring(7, token.length)
  } else if ((token = request.headers.get('cookie'))) {
    token = parse(token)['kumo-token']
  }

  if (!token) {
    return
  }

  if (!(await jwt.verify(token, env.JWT_SECRET))) {
    return
  }

  const { payload } = jwt.decode(token)
  request.user = payload as UserMetadata

  // TODO: let's measure if this cost more operations, or if it's better to just store the role in the JWT
  const role = await env.KV.get(`role:${request.user.ulid}`, { cacheTtl: 3600 })
  request.role = role ? Roles[role as RoleType] : Roles.noob

  console.log('request.user: ', request.user, ', request.role: ', request.role)
}

export const onlyRoles = (roles: Roles[]): RouteHandler => {
  return async (request: KumoRequest, env: Env, ctx: ExecutionContext) => {
    if (!request.role || !roles.includes(request.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden Zone' }), { status: 403 })
    }
  }
}
