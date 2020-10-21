import { KitsuneAgent, KitsuneSpace, kitsuneSpace } from '../kitsune/kitsune'
import { atob64 } from '../base64/base64'
import { pipe } from 'fp-ts/lib/pipeable'
import { encode, MessagePackData } from '../msgpack/msgpack'
import * as E from 'fp-ts/lib/Either'

function agentPubKeyFromKey(prefix:string, key:string):KitsuneAgent {
 if (key.indexOf(prefix) === 0) {
  return Uint8Array.from(Buffer.from(key.slice(prefix.length), 'base64'))
 }
 assert.unreachable(`${prefix} prefix not found at start of key ${key}`)
}

// Paginates through the kv list API using the space as a prefix.
// Returns all pubkeys for all agents currently registered in the space.
async function _list(space:KitsuneSpace):Array<KitsuneAgent> {
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
  keys = keys.concat(list.keys.map(k => agentPubKeyFromKey(prefix, k.name)))
 }
 return keys
}

export async function list(input:MessagePackData):MessagePackData|Error {
 return pipe(
  kitsuneSpace.decode(input),
  E.fold(
   errors => Error(JSON.stringify(errors)),
   async spaceValue => encode(await _list(spaceValue)),
  )
 )
}
