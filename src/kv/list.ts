import { Ctx } from '../ctx'
import * as Kitsune from '../kitsune/kitsune'
import * as Base64 from '../base64/base64'
import { pipe } from 'fp-ts/lib/pipeable'
import * as MP from '../msgpack/msgpack'
import * as E from 'fp-ts/lib/Either'
import { Uint8ArrayDecoder } from '../io/io'
import * as D from 'io-ts/Decoder'

// Restores a pubkey given a base64 prefix
function agentFromKey(prefix: Base64.Value, key: string): Kitsune.Agent {
  if (key.indexOf(prefix) === 0) {
    return Base64.toBytes(key.slice(prefix.length))
  }
  throw new Error(`${prefix} prefix not found at start of key ${key}`)
}

// Paginates through the kv list API using the space as a prefix.
// Returns all pubkeys for all agents currently registered in the space.
export async function list(
  space: Kitsune.Space,
  ctx: Ctx,
): Promise<Array<Kitsune.Agent>> {
  let prefix = Base64.fromBytes(space)
  let keys: any[] = []
  let more = true
  let cursor

  while (more) {
    let options: {
      prefix: string
      cursor: any
    } = {
      prefix: prefix,
      cursor: undefined,
    }
    if (cursor) {
      options.cursor = cursor
    }

    // This comes from cloudflare in the kv binding.
    const list = await ctx.BOOTSTRAP.list(options)

    if (list.list_complete) {
      more = false
    } else {
      more = true
      cursor = list.cursor
    }

    keys = keys.concat(list.keys.map((k) => agentFromKey(prefix, k.name)))
  }
  return keys
}
