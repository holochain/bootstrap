import * as Kitsune from '../kitsune/kitsune'
import { atob64 } from '../base64/base64'
import { pipe } from 'fp-ts/lib/pipeable'
import * as MP from '../msgpack/msgpack'
import * as E from 'fp-ts/lib/Either'
import { Uint8ArrayDecoder } from '../io/io'

function agentFromKey(prefix:string, key:string):KitsuneAgent {
 if (key.indexOf(prefix) === 0) {
  return Uint8Array.from(Buffer.from(key.slice(prefix.length), 'base64'))
 }
 assert.unreachable(`${prefix} prefix not found at start of key ${key}`)
}

// Paginates through the kv list API using the space as a prefix.
// Returns all pubkeys for all agents currently registered in the space.
export async function _list(space:KitsuneSpace):Array<KitsuneAgent> {
 let prefix = atob64(space)
 let keys = []
 let more = true
 let cursor;

 while (more) {
  let options = {'prefix': prefix}
  if ( cursor) {
   options.cursor = cursor
  }

  let list = await BOOTSTRAP.list(options)

  more = !list.list_complete
  cursor = list.cursor
  keys = keys.concat(list.keys.map(k => agentFromKey(prefix, k.name)))
 }
 return keys
}

export async function list(input:MessagePackData):MessagePackData|Error {
 return pipe(
  Uint8ArrayDecoder.decode(input),
  E.chain(value => MP.messagePackDecoder.decode(value)),
  E.chain(value => Kitsune.Space.decode(value)),
  E.chain(async spaceValue => MP.encode(await _list(spaceValue))),
 )
}
