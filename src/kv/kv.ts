import { pipe } from 'fp-ts/lib/pipeable'
import { agentInfoSigned, agentInfoSignedSafe } from '../agent_info/signed'
import * as E from 'fp-ts/Either'
import { atob64 } from '../base64/base64'
import { encode, MessagePackData } from '../msgpack/msgpack'
import { strict as assert } from 'assert'
import { KitsuneSpace, KitsuneAgent, spaceLength, agentLength } from '../kitsune/kitsune'

const EXPIRES_AFTER: number = 60 * 10

// Constructs a key for a space and agent pair that makes sense for cloudflare
// prefix lookups.
// i.e. concatenates two _separate_ base64 encoded binaries of space/agent
// which is different to the base64 encoding of the concatenated binaries
// i.e. we concatenate the strings to preserve a 'prefix' that matches the space
export function agentKey(space:KitsuneSpace, agent:KitsuneAgent):string {
 return '' + atob64(space) + atob64(agent)
}

// Store an AgentInfoSignedRaw under the relevant key.
// Errors if the AgentInfoSignedRaw does not decode to a safe AgentInfo.
export async function putAgentInfoSigned(agentInfoSignedRawData:MessagePackData):MessagePackData|Error {
 let doPut = async agentInfoSigned => {
  let key = agentKey(agentInfoSigned.agent_info.space, agentInfoSigned.agent_info.agent)
  let value = agentInfoSignedRawData
  // In production we want the keys to expire relative to the time they were
  // signed to enforce that agents produce freshly signed info for each put.
  // In testing this breaks our ability to use static fixtures so we use an
  // expiry time relative to 'now' instead
  let baseTime = ENVIRONMENT === 'production' ? agentInfoSigned.agent_info.signed_at_ms : Date.now()
  let expires = Math.floor( baseTime / 1000 ) + EXPIRES_AFTER

  await BOOTSTRAP.put(key, value, {expiration: expires})
 }

 return encode(pipe(
  agentInfoSignedSafe.decode(agentInfoSignedRawData),
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

 return encode(keys)
}

export async function getAgentInfoSigned(key:Uint8Array):MessagePackData {
 let space = key.slice(0,spaceLength)
 let agent = key.slice(spaceLength)

 // Values are already messagepack data so get them as arrayBinary data.
 return await BOOTSTRAP.get(agentKey(space, agent), 'arrayBuffer')
}
