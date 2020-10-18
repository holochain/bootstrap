import * as D from "io-ts/Decoder"
import { kitsuneSpace, kitsuneAgent } from '../kitsune/kitsune'
import { encode, decode } from '../msgpack/msgpack'
import { Ed25519 } from '../crypto/crypto'
import { Uint8ArrayDecoder } from '../io/io'

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

export namespace AgentInfo {
 export function pack(agent_info:AgentInfo):AgentInfoPacked {
  return encode(agent_info)
 }

 export function unpack(data:AgentInfoPacked):AgentInfo|Error {
  try {
   return decode(data)
  } catch (e) {
   return e
  }
 }
}
