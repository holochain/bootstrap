import { AgentInfoSigned, AgentInfoPacked, KitsuneSignature, KitsuneSpace, KitsuneBin, Urls, AgentInfo, KitsuneAgent } from '../src/agent_info'
import { strict as assert } from 'assert'

const vaporChatSpace:KitsuneSpace = new KitsuneBin(Uint8Array.from([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33]))

// keys generated with https://tweetnacl.js.org/#/sign
const base64ToBytes = function (base64) {
  return Uint8Array.from(Buffer.from(base64, 'base64'))
}
const alice_secret:Uint8Array = base64ToBytes('GAPp1NvexlHiWDtHztLfrYmJxcANqZiWW3bm7bdLXH329oxAe1uX2x4y4USVu40c6QuDqwcjIZFixvB7RrzgCA==')
const alice_pub_key:Uint8Array = base64ToBytes('9vaMQHtbl9seMuFElbuNHOkLg6sHIyGRYsbwe0a84Ag=')
const alice_urls:Urls = ['https://example.com', 'https://foo.com']
const alice = {
  space: vaporChatSpace,
  agent: new KitsuneBin(alice_pub_key),
  urls: alice_urls,
  signed_at_ms: 1602767728019
}

describe('agent info signed', () => {
  const signature_bytes:KitsuneSignature.Encoded = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32])
  const signature:KitsuneSignature|Error = KitsuneSignature.decode(signature_bytes)

  if (signature instanceof Error) {
    console.error(signature)
    throw signature
  }

  const agent_info_packed:AgentInfoPacked|Error = AgentInfoPacked.decode(new AgentInfo(alice).pack())

  assert.deepEqual(
    new AgentInfoPacked(Uint8Array.from([
      222, 0, 4, 165, 115, 112, 97, 99, 101, 222, 0, 1, 165, 118, 97, 108, 117,
      101, 196, 32, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
      19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 165, 97, 103,
      101, 110, 116, 222, 0, 1, 165, 118, 97, 108, 117, 101, 196, 32, 246, 246,
      140, 64, 123, 91, 151, 219, 30, 50, 225, 68, 149, 187, 141, 28, 233, 11,
      131, 171, 7, 35, 33, 145, 98, 198, 240, 123, 70, 188, 224, 8, 164, 117,
      114, 108, 115, 146, 179, 104, 116, 116, 112, 115, 58, 47, 47, 101, 120,
      97, 109, 112, 108, 101, 46, 99, 111, 109, 175, 104, 116, 116, 112, 115,
      58, 47, 47, 102, 111, 111, 46, 99, 111, 109, 172, 115, 105, 103, 110, 101,
      100, 95, 97, 116, 95, 109, 115, 203, 66, 119, 82, 198, 106, 217, 48, 0
    ])),
    agent_info_packed
  )

  if (agent_info_packed instanceof Error) {
    console.error(agent_info_packed)
    throw agent_info_packed
  }

  const agent_info_signed:AgentInfoSigned = {
    signature: signature,
    agent_info: agent_info_packed
  }
})
