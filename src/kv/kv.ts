import { pipe } from 'fp-ts/lib/pipeable'
import { agentInfoSigned, agentInfoSignedSafe } from '../agent_info/signed'
import * as E from 'fp-ts/Either'
import { atob64 } from '../base64/base64'
import { encode } from '../msgpack/msgpack'
import { strict as assert } from 'assert'

const KEY_SEPARATOR:string = '.'

// Converts an AgentInfoSigned to a {space}.{agentpubkey} to be used as the kv
// key on Cloudflare.
function keyFromAgentInfoSigned(agentInfoSigned:AgentInfoSigned):Uint8Array {
 let spaceBase64 = atob64(agentInfoSigned.agent_info.space)
 let agentBase64 = atob64(agentInfoSigned.agent_info.agent)
 return '' + spaceBase64 + KEY_SEPARATOR + agentBase64
}

// Store an AgentInfoSignedRaw under the relevant key.
// Errors if the AgentInfoSignedRaw does not decode to a safe AgentInfo.
export async function putAgentInfoSigned(agentInfoSignedRaw:AgentInfoSignedRaw):MessagePackData|Error {
 let doPut = async agentInfoSigned => {
  let key = keyFromAgentInfoSigned(agentInfoSigned)
  let value = agentInfoSignedRaw
  await BOOTSTRAP.put(key, value)
 }

 return encode(pipe(
  agentInfoSignedSafe.decode(agentInfoSignedRaw),
  E.fold(
   errors => Error(JSON.stringify(errors)),
   agentInfoSignedValue => doPut(agentInfoSignedValue),
  )
 ))
}

function agentPubKeyFromKey(prefix:string, key:string):KitsuneAgent {
 if (key.indexOf(prefix) === 0) {
  return Uint8Array.from(Buffer.from(key.slice(prefix.length), 'base64'))
 }
 assert.unreachable(`${prefix} prefix not found at start of key ${key}`)
}

// Paginates through the kv list API using the space as a prefix.
// Returns all pubkeys for all agents currently registered in the space.
export async function listSpace(space:KitsuneSpace):MessagePackData {
 let prefix = '' + atob64(space) + KEY_SEPARATOR
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

 return encode(keys)
}
