import * as MP from '../msgpack/msgpack'
import { agentKey } from '../kv/kv'
import { pipe } from 'fp-ts/lib/pipeable'
import { agentInfoSignedRawSafe, agentInfoSignedSafe } from '../agent_info/signed'
import * as E from 'fp-ts/lib/Either'
import * as D from 'io-ts/Decoder'

// Store an AgentInfoSignedRaw under the relevant key.
// Errors if the AgentInfoSignedRaw does not decode to a safe AgentInfo.
async function _put(agentInfoSignedRawData:MP.MessagePackData):void|Error {
 let doPut = async agentInfoSigned => {
  let key = agentKey(agentInfoSigned.agent_info.space, agentInfoSigned.agent_info.agent)
  let value = agentInfoSignedRawData
  // Info expires relative to the time they were signed to enforce that agents
  // produce freshly signed info for each put.
  // Agents MUST explicitly set an expiry time relative to their signature time.
  let expires = Math.floor( ( agentInfoSigned.agent_info.expires_after_ms + agentInfoSigned.agent_info.signed_at_ms ) / 1000 )

  await BOOTSTRAP.put(key, value, {expiration: expires})
  return null
 }

 return pipe(
  agentInfoSignedSafe.decode(agentInfoSignedRawData),
  E.chain(async agentInfoSignedValue => D.success(await doPut(agentInfoSignedValue))),
  E.mapLeft(v => Error(JSON.stringify(v))),
 )
}

export async function put(input:MP.MessagePackData):MP.MessagePackData|Error {
 // put literally puts the raw MessagePackData to the kv store if it validates.
 // the key is derived from the raw data.
 let p = await _put(input)
 if (E.isLeft(p)) {
  return p.left
 }
 else {
  return MP.encode(p.right)
 }
}
