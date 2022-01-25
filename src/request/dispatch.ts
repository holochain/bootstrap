import { Ctx } from '../ctx'
import { postHandler } from './post'
import rust_to_wasm from '../rust-ffi'

export async function requestDispatch(ctx: Ctx): Promise<Response> {
  // first, dispatch to wasm, if the rust ffi errors,
  // move on to handling with the legacy code

  const method = ctx.request.method
  const op = ctx.request.headers.get('X-Op') || ''
  const input = new Uint8Array(await ctx.request.arrayBuffer())

  try {
    const response = await rust_to_wasm.handle_request(
      ctx.BOOTSTRAP,
      method,
      op,
      input.slice(),
    )
    return new Response(response.body, {
      status: response.status,
      headers: new Headers(response.headers),
    })
  } catch (e) {
    // for now, ignore errors and fall back to legacy logic
    // return new Response('' + e, { status: 500 })
  }

  //const testRes = await rust_to_wasm.proxy_list(ctx.BOOTSTRAP)
  //console.error('@@-r2w-proxy_list-test-@@', testRes)

  if (ctx.request.method === 'POST') {
    return postHandler(ctx, input)
  }

  // Respond with a simple pong for any GET to help with smoke testing.
  if (ctx.request.method === 'GET') {
    return new Response('OK')
  }

  return new Response('unhandled request', { status: 500 })
}
