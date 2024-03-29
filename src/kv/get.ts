import { Ctx } from '../ctx'
import * as MP from '../msgpack/msgpack'
import { Key, agentKey } from '../kv/kv'
import * as Kitsune from '../kitsune/kitsune'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import { Uint8ArrayDecoder } from '../io/io'
import * as D from 'io-ts/Decoder'

// Get a single signed agent info by its space+agent key in the kv store.
// Returns:
// - The signed agent info data, as signed by the agent, as messagepack data OR
// - null encoded as messagepack if the key does not exist OR
// - an error if there is some error
export async function get(
  key: Key,
  ctx: Ctx,
): Promise<MP.MessagePackData | Error> {
  try {
    let space = key.slice(0, Kitsune.spaceLength)
    let agent = key.slice(Kitsune.spaceLength)
    let pkey = ''
    if (ctx.net === 'tx5') {
      pkey += 'tx5:'
    }
    pkey += agentKey(space, agent)
    let value = await ctx.BOOTSTRAP.get(pkey, 'arrayBuffer')
    // Found values are already messagepack encoded but null won't be so we have to
    // manually encode it here.
    return value === null ? MP.encode(null) : new Uint8Array(value)
  } catch (e) {
    if (e instanceof Error) {
      return e
    } else {
      return new Error(JSON.stringify(e))
    }
  }
}
