import * as Kitsune from '../kitsune/kitsune'
import * as Base64 from '../base64/base64'
import { atob64 } from '../base64/base64'
import { pipe } from 'fp-ts/lib/pipeable'
import * as MP from '../msgpack/msgpack'
import * as E from 'fp-ts/lib/Either'
import { Uint8ArrayDecoder } from '../io/io'
import * as D from 'io-ts/Decoder'

// Restores a pubkey given a base64 prefix
function agentFromKey(prefix:Base64.Value, key:string):KitsuneAgent {
 if (key.indexOf(prefix) === 0) {
  return Base64.toBytes(key.slice(prefix.length))
 }
 assert.unreachable(`${prefix} prefix not found at start of key ${key}`)
}

// Paginates through the kv list API using the space as a prefix.
// Returns all pubkeys for all agents currently registered in the space.
export async function list(space:KitsuneSpace):Array<KitsuneAgent> {
 let prefix = Base64.fromBytes(space)
 let keys = []
 let more = true
 let cursor;

 while (more) {
  let options = {'prefix': prefix}
  if ( cursor) {
   options.cursor = cursor
  }

  // This comes from cloudflare in the kv binding.
  let list = await BOOTSTRAP.list(options)

  more = !list.list_complete
  cursor = list.cursor
  keys = keys.concat(list.keys.map(k => agentFromKey(prefix, k.name)))
 }
 return keys
}
