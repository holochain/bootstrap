import { pack as mpPack, unpack as mpUnpack } from 'msgpackr'
import { Ed25519 } from '../crypto/crypto'
import { KitsuneSignature, KitsuneAgent, KitsuneSpace } from '../kitsune/kitsune'

export type Url = string
export type Urls = Array<Url>

export class AgentInfoPacked {
 private value: Uint8Array
 constructor(value:Uint8Array) {
  this.value = Uint8Array.from(value)
 }

 encode():AgentInfoPacked.Encoded {
  return this.value
 }
}

export namespace AgentInfoPacked {
 export type Value = Uint8Array
 export type Encoded = Uint8Array

 export function decode(encoded:AgentInfoPacked.Encoded):AgentInfoPacked|Error {
  try {
   return new AgentInfoPacked(encoded)
  }
  catch (e) {
   return e
  }
 }
}

export interface AgentInfoSignedData {
 signature: KitsuneSignature,
 agent: KitsuneAgent,
 agent_info: AgentInfoPacked,
}

export class AgentInfoSigned {
 private value:AgentInfoSignedData
 constructor(value:AgentInfoSignedData) {
  this.value = value
 }

 public verify():boolean {
  return Ed25519.verify(this.value.agent_info.encode(), this.value.signature.encode(), this.value.agent.encode())
 }
}

export namespace AgentInfoSigned {
 export function tryFromData(data:AgentInfoSignedData):AgentInfoSigned|Error {
  let optimistic_value = new AgentInfoSigned(data)
  if (optimistic_value.verify()) {
   return optimistic_value
  } else {
   return Error(AgentInfoSigned.name + ' failed to verify ' + JSON.stringify(data))
  }
 }
}

export interface AgentInfoData {
 space: KitsuneSpace,
 agent: KitsuneAgent,
 urls: Urls,
 signed_at_ms: number,
}

export class AgentInfo {
 private value: AgentInfoData
 constructor(value:AgentInfoData) {
  this.value = value
 }
 public pack = () => {
  return mpPack(this.value)
 }
}

export namespace AgentInfo {
 export function unpack(data:Uint8Array):AgentInfo {
  return new AgentInfo(mpUnpack(Buffer.from(data)))
 }
}
