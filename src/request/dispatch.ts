import { Ctx } from '../ctx'
import { postHandler } from './post'

export async function requestDispatch(ctx: Ctx): Promise<Response> {
  const method = ctx.request.method
  const op = ctx.request.headers.get('X-Op') || ''
  const input = new Uint8Array(await ctx.request.arrayBuffer())

  if (method === 'POST') {
    return postHandler(ctx, op, input)
  }

  // Respond with a simple pong for any GET to help with smoke testing.
  if (method === 'GET') {
    return new Response('OK')
  }

  return new Response('unhandled request', { status: 500 })
}
