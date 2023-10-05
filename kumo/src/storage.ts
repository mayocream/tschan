import { KumoRequest } from './kumo'

/**
 * Project storage
 * - create file
 */
export default async function (request: KumoRequest, env: Env, ctx: ExecutionContext): Promise<Response> {
	return new Response(null, { status: 405 })
}
