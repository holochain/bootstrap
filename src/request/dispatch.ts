import { Ctx } from '../ctx'
import { postHandler } from './post'

function opFromPath(url: string): string {
  const res = new RegExp('^\\/([^\\/]*)').exec(new URL(url).pathname)
  return Array.isArray(res) && typeof res[1] === 'string' ? res[1] : ''
}

export async function requestDispatch(ctx: Ctx): Promise<Response> {
  const method = ctx.request.method
  const op = ctx.request.headers.get('X-Op') || opFromPath(ctx.request.url)
  const input = new Uint8Array(await ctx.request.arrayBuffer())

  try {
    const response = await ctx.bootstrapWasm.handle_request(
      ctx.BOOTSTRAP,
      ctx.wasmHost,
      method,
      op,
      input,
    )
    return new Response(response.body, {
      status: response.status,
      headers: new Headers(response.headers),
    })
  } catch (e) {
    ctx.wasmError = ('' + e).replace(/\r/g, '').replace(/\n/g, '')
    console.error('@wasm:error@', e)
    // for now, ignore errors and fall back to legacy logic
  }

  if (method === 'POST') {
    return postHandler(ctx, op, input)
  }

  // Respond with a simple pong for any GET to help with smoke testing.
  if (method === 'GET') {
    return ctx.newResponse('OK')
  }

  return ctx.newResponse('unhandled request', { status: 500 })
}
