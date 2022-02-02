import { Ctx } from '../ctx'
import { postHandler } from './post'
import bootstrap_wasm from '../rust-wasm'

export async function requestDispatch(ctx: Ctx): Promise<Response> {
  const method = ctx.request.method
  const op = ctx.request.headers.get('X-Op') || ''
  const input = new Uint8Array(await ctx.request.arrayBuffer())

  try {
    const response = await bootstrap_wasm.handle_request(
      ctx.BOOTSTRAP,
      method,
      op,
      input,
    )
    return new Response(response.body, {
      status: response.status,
      headers: new Headers(response.headers),
    })
  } catch (e) {
    console.error('@wasm:error@', e)
    // for now, ignore errors and fall back to legacy logic
  }

  if (method === 'POST') {
    return postHandler(ctx, op, input)
  }

  // Respond with a simple pong for any GET to help with smoke testing.
  if (method === 'GET') {
    return new Response('OK')
  }

  return new Response('unhandled request', { status: 500 })
}
