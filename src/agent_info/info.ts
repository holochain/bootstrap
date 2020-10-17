import { KitsuneBin } from '../kitsune/kitsune'
import { encode, decode } from '../msgpack/msgpack'
import { Ed25519 } from '../crypto/crypto'

export type Url = string
export type Urls = Array<Url>

export type AgentInfoPacked = Uint8Array

export interface AgentInfo {
 space: KitsuneBin,
 agent: KitsuneBin,
 urls: Urls,
 signed_at_ms: number,
}

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

 function validSpace(agent_info:AgentInfo):boolean {
  return agent_info.space.length === 32
 }

 function validAgent(agent_info:AgentInfo):boolean {
  return Ed25519.validPublicKey(agent_info.agent)
 }

 function validSignedAtMs(agent_info:AgentInfo):boolean {
  return Date.now() >= agent_info.signed_at_ms
 }

 export function valid(agent_info:AgentInfo):boolean {
  return validAgent(agent_info) && validSpace(agent_info) && validSignedAtMs(agent_info)
 }
}
