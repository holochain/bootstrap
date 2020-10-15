import { pack as mpPack } from 'msgpackr'

export class KitsuneSignature {
 private value: KitsuneSignature.Value
 constructor(value:KitsuneSignature.Value) {
  // sometimes this comes in as a buffer so be defensive
  this.value = Uint8Array.from(value)
 }

 encode():KitsuneSignature.Encoded {
  return this.value
 }
}

export namespace KitsuneSignature {
 export type Value = Uint8Array
 export type Encoded = Uint8Array

 export function decode(encoded:KitsuneSignature.Encoded):KitsuneSignature|Error {
  if (encoded.length === 32) {
   try {
    return new KitsuneSignature(encoded)
   }
   catch (e) {
    return e
   }
  }
  return Error(KitsuneSignature.name + ' failed to decode ' + JSON.stringify(encoded))
 }
}

export class KitsuneBin {
 private value: Uint8Array
 constructor(value:Uint8Array) {
  // sometimes this comes in as a buffer so be defensive
  this.value = Uint8Array.from(value)
 }
}

export type KitsuneSpace = KitsuneBin
export type KitsuneAgent = KitsuneBin

export type Url = string
export type Urls = Array<Url>

export class AgentInfoPacked {
 private value: Uint8Array
 constructor(value:Uint8Array) {
  this.value = Uint8Array.from(value)
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

export interface AgentInfoSigned {
 signature: KitsuneSignature,
 agent_info: AgentInfoPacked,
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
