import { KitsuneBin, KitsuneSignature, KitsuneAgent } from '../kitsune/kitsune'
import { AgentInfoPacked } from './packed'
import { Ed25519 } from '../crypto/crypto'

export interface AgentInfoSignedData {
 signature: KitsuneSignature.Encoded,
 agent: KitsuneBin.Encoded,
 agent_info: AgentInfoPacked,
}

export class AgentInfoSigned {
 private value:AgentInfoSignedData
 constructor(value:AgentInfoSignedData) {
  this.value = value
 }

 public verify():boolean {
  return Ed25519.verify(this.value.agent_info.encode(), this.value.signature, this.value.agent)
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
