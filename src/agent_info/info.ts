import * as D from "io-ts/Decoder"
import { kitsuneSpace, kitsuneAgent } from '../kitsune/kitsune'
import { encode, decode, MessagePackData, messagePackData, messagePackDecoder } from '../msgpack/msgpack'
import { Ed25519 } from '../crypto/crypto'
import { Uint8ArrayDecoder } from '../io/io'
import { pipe } from 'fp-ts/lib/pipeable'
import * as E from 'fp-ts/lib/Either'
import { strict as assert } from 'assert'
import * as _ from 'lodash'

export const url = D.string
export type Url = D.TypeOf<typeof url>

export const urls = D.array(D.string)
export type Urls = D.TypeOf<typeof urls>

export const agentInfoPacked = Uint8ArrayDecoder
export type AgentInfoPacked = D.TypeOf<typeof agentInfoPacked>

export const signedAtMs = D.number
export type SignedAtMs = D.TypeOf<typeof signedAtMs>

export const agentInfo = D.type({
 space: kitsuneSpace,
 agent: kitsuneAgent,
 urls: urls,
 signed_at_ms: signedAtMs,
})
export type AgentInfo = D.TypeOf<typeof agentInfo>

export const agentInfoSafe: D.Decoder<MessagePackData, AgentInfo> = {
 decode: (a: unknown) => {
  return pipe(
   Uint8ArrayDecoder.decode(a),
   E.chain(value => messagePackDecoder.decode(value)),
   E.fold(
    errors => D.failure(a, JSON.stringify(errors)),
    rawValue => pipe(
     agentInfo.decode(rawValue),
     E.fold(
      errors => D.failure(a, JSON.stringify(errors)),
      agentInfoValue => {
       // Ensure that the decoded AgentInfo matches the generic object.
       // This flags the situation where additional properties were added to
       // the object that were dropped on the AgentInfo. We don't accept this
       // because honest nodes should always sign exactly valid data.
       if (_.isEqual(agentInfoValue, rawValue)) {
        return D.success(agentInfoValue)
       }
       else {
        return D.failure(a, JSON.stringify(agentInfoValue) + ' does not equal ' + JSON.stringify(rawValue))
       }
      }
     )
    )
   )
  )
 }
}
