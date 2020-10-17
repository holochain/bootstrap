import { KitsuneBin } from '../kitsune/kitsune'
import { encode, decode } from '../msgpack/msgpack'

export interface AgentInfoData {
 space: KitsuneBin.Value,
 agent: KitsuneBin.Value,
 urls: Urls,
 signed_at_ms: number,
}

export class AgentInfo {
 private value: AgentInfoData
 constructor(value:AgentInfoData) {
  this.value = value
 }
 public pack = () => {
  return encode(this.value)
 }
}

export namespace AgentInfo {
 export function unpack(data:Uint8Array):AgentInfo|Error {
  try {
   return new AgentInfo(decode(Buffer.from(data)))
  } catch (e) {
   return e
  }
 }
}

export type Url = string
export type Urls = Array<Url>
