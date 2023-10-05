import type { KumoRequest } from './kumo'
import { z } from 'zod'

/**
 * Project management
 * - create project
 * - project-user permissions
 * - delete project
 */

export default async function (request: KumoRequest, env: Env, ctx: ExecutionContext): Promise<Response> {
	const baseSchema = z.object({
		name: z.string().max(140),
		description: z.string().max(1000),
		author: z.string().max(140),
		users: z.array(z.string().max(140)),
	})

	if (request.method == 'GET') {

	}

	if (request.method == 'POST') {

	}

	if (request.method == 'PUT') {

	}

	if (request.method == 'DELETE') {

	}

	return new Response(null, { status: 405 })
}
