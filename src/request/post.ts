import { Ctx } from '../ctx'
import { put } from '../op/put'
import { random } from '../op/random'
import { now } from '../op/now'
import * as MP from '../msgpack/msgpack'

const OP_PUT: string = 'put'
const OP_RANDOM: string = 'random'
const OP_NOW: string = 'now'

async function handle(
  f: (bytes: Uint8Array, ctx: Ctx) => Promise<MP.MessagePackData | Error>,
  input: MP.MessagePackData,
  ctx: Ctx,
): Promise<Response> {
  // Every f needs to handle messagepack decoding itself so that the deserialized
  // object can sanity check itself.
  let tryF = await f(input, ctx)

  if (tryF instanceof Error) {
    console.error('messagepack input:', input.toString())
    console.error('error:', '' + tryF)
    return ctx.newResponse('' + tryF, { status: 500 })
  }

  return ctx.newResponse(tryF)
}

export async function postHandler(
  ctx: Ctx,
  op: string,
  input: Uint8Array,
): Promise<Response> {
  switch (op) {
    case OP_PUT:
      return handle(put, input, ctx)
    case OP_RANDOM:
      return handle(random, input, ctx)
    case OP_NOW:
      return handle(now, input, ctx)
    default:
      return ctx.newResponse(MP.encode('unknown op'), { status: 500 })
  }
  throw new Error('broken dispatch switch')
}
