import * as Crypto from '../../src/crypto/crypto'
import { vaporChatSpace, wikiSpace } from './spaces'
import { AgentInfo } from '../../src/agent_info/info'
import { AgentInfoSignedRaw } from '../../src/agent_info/signed'
import * as Kitsune from '../../src/kitsune/kitsune'
import { encode } from '../../src/msgpack/msgpack'
import { keypair } from './crypto'

export const alice = {
 publicKey: Uint8Array.from([
  95, 62, 138, 155, 147, 98, 254, 130, 27, 90, 189, 22, 214, 159, 53, 71, 110,
  8, 222, 90, 16, 252, 179, 208, 115, 252, 10, 63, 244, 211, 125, 115
 ]),
 secretKey: Uint8Array.from([
  185, 17, 98, 189, 195, 23, 240, 235, 171,  51, 178, 214, 33, 25, 217, 20, 250,
  197, 248, 164, 162, 36, 218, 17, 6, 152, 241, 29, 72, 36, 246, 155, 95, 62,
  138, 155, 147, 98, 254, 130, 27, 90, 189, 22, 214, 159, 53, 71, 110, 8, 222,
  90, 16, 252, 179, 208, 115, 252, 10, 63, 244, 211, 125, 115
 ]),
}

export const bob = {
 publicKey: Uint8Array.from([
  208, 28, 22, 215, 187, 154, 60, 168, 229, 6, 79, 163, 128, 143, 17, 156, 124,
  230, 192, 4, 137, 124, 84, 121, 212, 49, 14, 156, 25, 120, 4, 129
 ]),
 secretKey: Uint8Array.from([
  145, 37, 159, 254, 196, 64, 171, 49, 149, 7, 17, 253, 171, 58, 253, 214, 8,
  76, 23, 4, 162, 194, 57, 130, 150, 208, 107, 148, 95, 253, 168, 61, 208, 28,
  22, 215, 187, 154, 60, 168, 229, 6, 79, 163, 128, 143, 17, 156, 124, 230, 192,
  4, 137, 124, 84, 121, 212, 49, 14, 156, 25, 120, 4, 129
 ]),
}

export const publicKeyToKitsuneAgent = (publicKey:Uint8Array):Kitsune.Agent =>
 Uint8Array.from([...publicKey, ...new Uint8Array(Array(4))])
 // publicKey

export const aliceAgentVapor:AgentInfo = {
 space: vaporChatSpace,
 agent: publicKeyToKitsuneAgent(alice.publicKey),
 urls: ['https://example.com', 'https://foo.com'],
 signed_at_ms: Date.now(),
 expires_after_ms: 100000,
}
export const aliceAgentVaporSignedRaw:AgentInfoSignedRaw = {
 signature: Crypto.sign(encode(aliceAgentVapor), alice.secretKey),
 agent: publicKeyToKitsuneAgent(alice.publicKey),
 agent_info: encode(aliceAgentVapor),
}

export const aliceAgentWiki:AgentInfo = {
 space: wikiSpace,
 agent: publicKeyToKitsuneAgent(alice.publicKey),
 urls: ["https://alice.com"],
 signed_at_ms: Date.now(),
 expires_after_ms: 150000,
}
export const aliceAgentWikiSignedRaw:AgentInfoSignedRaw = {
 signature: Crypto.sign(encode(aliceAgentWiki), alice.secretKey),
 agent: publicKeyToKitsuneAgent(alice.publicKey),
 agent_info: encode(aliceAgentWiki),
}

export const bobAgentVapor:AgentInfo = {
 space: vaporChatSpace,
 agent: publicKeyToKitsuneAgent(bob.publicKey),
 urls: ["https://bob.com"],
 signed_at_ms: Date.now(),
 expires_after_ms: 100000,
}
export const bobAgentVaporSignedRaw:AgentInfoSignedRaw = {
 signature: Crypto.sign(encode(bobAgentVapor), bob.secretKey),
 agent: publicKeyToKitsuneAgent(bob.publicKey),
 agent_info: encode(bobAgentVapor),
}

// this is bad, bob must not be allowed to sign alice
export const bobSignedAliceRaw:AgentInfoSignedRaw = {
 signature: Crypto.sign(encode(aliceAgentVapor), bob.secretKey),
 agent: publicKeyToKitsuneAgent(bob.publicKey),
 agent_info: encode(aliceAgentVapor),
}
