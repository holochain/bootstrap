import * as MP from '../msgpack/msgpack'
import * as AgentInfo from '../agent_info/info'
import * as AgentSigned from '../agent_info/signed'
import * as KV from './kv'
import * as D from 'io-ts/Decoder'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'

// Store an AgentInfoSignedRaw under the relevant key.
// Returns error if the AgentInfoSignedRaw does not decode to a safe AgentInfo.
// This includes validation issues such as invalid cryptographic signatures.
// Returns null if everything works and the put is successful.
export async function put(agentInfoSignedRawData:MP.MessagePackData):void|Error {
 try {
  let doPut = async agentInfoSigned => {
   let key = KV.agentKey(agentInfoSigned.agent_info.space, agentInfoSigned.agent_info.agent)
   let value = agentInfoSignedRawData
   // Info expires relative to the time they were signed to enforce that agents
   // produce freshly signed info for each put.
   // Agents MUST explicitly set an expiry time relative to their signature time.
   let expires = Math.floor( ( agentInfoSigned.agent_info.expires_after_ms + agentInfoSigned.agent_info.signed_at_ms ) / 1000 )

   // Cloudflare binds this global to the kv store.
   await BOOTSTRAP.put(key, value, {expiration: expires})
   return null
  }

  return pipe(
   AgentSigned.AgentInfoSignedSafe.decode(agentInfoSignedRawData),
   E.chain(async agentInfoSignedValue => D.success(await doPut(agentInfoSignedValue))),
   E.mapLeft(v => Error(JSON.stringify(v))),
  )
 }
 catch (e) {
  return e
 }
}
