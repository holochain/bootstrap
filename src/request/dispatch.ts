import { Ctx } from '../ctx'
import { postHandler } from './post'
import rust_to_wasm from '../rust-ffi'

export async function requestDispatch(ctx: Ctx): Promise<Response> {
  const testRes = await rust_to_wasm.proxy_list(ctx.BOOTSTRAP)
  console.error('@@-r2w-proxy_list-test-@@', testRes)

  if (ctx.request.method === 'POST') {
    return postHandler(ctx)
  }

  // Respond with a simple pong for any GET to help with smoke testing.
  if (ctx.request.method === 'GET') {
    return new Response('OK')
  }

  return new Response('unhandled request', { status: 500 })
}
