import * as MP from '../msgpack/msgpack'
import { agentKey } from '../kv/kv'
import { pipe } from 'fp-ts/lib/pipeable'
import { agentInfoSignedRawSafe, agentInfoSignedSafe } from '../agent_info/signed'
import * as E from 'fp-ts/lib/Either'
import * as D from 'io-ts/Decoder'

const EXPIRES_AFTER: number = 60 * 10

// Store an AgentInfoSignedRaw under the relevant key.
// Errors if the AgentInfoSignedRaw does not decode to a safe AgentInfo.
async function _put(agentInfoSignedRawData:MP.MessagePackData):void|Error {
 let doPut = async agentInfoSigned => {
  let key = agentKey(agentInfoSigned.agent_info.space, agentInfoSigned.agent_info.agent)
  let value = agentInfoSignedRawData
  // In production we want the keys to expire relative to the time they were
  // signed to enforce that agents produce freshly signed info for each put.
  // In testing this breaks our ability to use static fixtures so we use an
  // expiry time relative to 'now' instead
  let baseTime = ENVIRONMENT === 'production' ? agentInfoSigned.agent_info.signed_at_ms : Date.now()
  let expires = Math.floor( baseTime / 1000 ) + EXPIRES_AFTER

  console.log('put', key, value)
  await BOOTSTRAP.put(key, value, {expirationTtl: expires})
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
