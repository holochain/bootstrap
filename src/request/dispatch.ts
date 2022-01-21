import { Ctx } from '../ctx'
import { postHandler } from './post'
import rust_to_wasm from '../rust-ffi'

export async function requestDispatch(ctx: Ctx): Promise<Response> {
  console.error('@@@@@', rust_to_wasm)
  console.error('@@@@@', rust_to_wasm.wasm_test_fn('hello'))
  /*
  const R2W = await loadWasm()
  const testRes = await R2W.proxy_list({
    kv_list: async (limit: any, prefix: any, cursor: any) => {
      return new Promise((res, _rej) => {
        setTimeout(() => {
          res('got: ' + JSON.stringify({ limit, prefix, cursor }))
        }, 1)
      })
    },
  })
  console.error('@@-r2w-proxy_list-test-@@', testRes)
   */

  if (ctx.request.method === 'POST') {
    return postHandler(ctx)
  }

  // Respond with a simple pong for any GET to help with smoke testing.
  if (ctx.request.method === 'GET') {
    return new Response('OK')
  }

  return new Response('unhandled request', { status: 500 })
}
