import * as D from "io-ts/Decoder"
import { kitsuneSpace, kitsuneAgent } from '../kitsune/kitsune'
import { encode, decode, MessagePackData, messagePackData, messagePackDecoder } from '../msgpack/msgpack'
import { Ed25519 } from '../crypto/crypto'
import { Uint8ArrayDecoder } from '../io/io'
import { pipe } from 'fp-ts/lib/pipeable'
// import { either, Either } from 'fp-ts/lib/Either'
import * as E from 'fp-ts/lib/Either'

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
   E.fold(
    errors => D.failure(a, JSON.stringify(errors)),
    value => pipe(
     messagePackDecoder.decode(value),
     E.fold(
      errors => D.failure(a, JSON.stringify(errors)),
      value => pipe(
       agentInfo.decode(value),
       E.fold(
        errors => D.failure(a, JSON.stringify(errors)),
        value => D.success(value),
       )
      )
     )
    )
   )
  )
 }
}
