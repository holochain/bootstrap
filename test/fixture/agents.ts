import { Ed25519 } from '../../src/crypto/crypto'
import { vaporChatSpace } from './spaces'
import { AgentInfo } from '../../src/agent_info/info'
import { AgentInfoSigned } from '../../src/agent_info/signed'
import { KitsuneBin } from '../../src/kitsune/kitsune'

// all keys generated with https://tweetnacl.js.org/#/sign

export const aliceSecret:Ed25519.SecretKey = Ed25519.base64ToBytes('GAPp1NvexlHiWDtHztLfrYmJxcANqZiWW3bm7bdLXH329oxAe1uX2x4y4USVu40c6QuDqwcjIZFixvB7RrzgCA==')
export const alicePublic:Ed25519.PublicKey = Ed25519.base64ToBytes('9vaMQHtbl9seMuFElbuNHOkLg6sHIyGRYsbwe0a84Ag=')
export const aliceAgentVapor:AgentInfo = {
 space: vaporChatSpace,
 agent: alicePublic,
 urls: ['https://example.com', 'https://foo.com'],
 signed_at_ms: 1602767728019,
}
export const aliceAgentVaporSigned:AgentInfoSigned = {
 signature: Ed25519.sign(AgentInfo.pack(aliceAgentVapor), aliceSecret),
 agent: alicePublic,
 agent_info: AgentInfo.pack(aliceAgentVapor),
}

export const bobSecret:Ed25519.SecretKey = Ed25519.base64ToBytes('D8U4J8rCvyxCYMHoFnsyFck4S0+DLwRaophRQh4gU2MjGgH84u96jOqCiom+BGBF/UcGv14ZbqXFA7YudnpL6A==')
export const bobPublic:Ed25519.PublicKey = Ed25519.base64ToBytes('IxoB/OLveozqgoqJvgRgRf1HBr9eGW6lxQO2LnZ6S+g=')
export const bobAgentVapor:AgentInfo = {
 space: vaporChatSpace,
 agent: bobPublic,
 urls: ["https://bob.com"],
 signed_at_ms: 1602767738019,
}
