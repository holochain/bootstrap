import { KitsuneBin, KitsuneSignature, KitsuneAgent } from '../kitsune/kitsune'
import { AgentInfoPacked, AgentInfo } from './info'
import { Ed25519 } from '../crypto/crypto'

export interface AgentInfoSigned {
 signature: KitsuneSignature.Encoded,
 agent: KitsuneBin,
 agent_info: AgentInfoPacked,
}

export namespace AgentInfoSigned {
 function validSignature(agent_info_signed:AgentInfoSigned):boolean {
  return Ed25519.verify(
   agent_info_signed.agent_info,
   agent_info_signed.signature,
   agent_info_signed.agent
  )
 }

 function validAgentInfo(agent_info_signed:AgentInfoSigned):boolean {
  const agent_info:AgentInfo|Error = AgentInfo.unpack(agent_info_signed.agent_info)
  if (agent_info instanceof Error) {
   return false
  }

  return ( agent_info.agent === agent_info_signed.agent ) && AgentInfo.valid(agent_info)
 }

 export function valid(agent_info_signed:AgentInfoSigned):boolean {
  return validSignature(agent_info_signed) && validAgentInfo(agent_info_signed)
 }
}
