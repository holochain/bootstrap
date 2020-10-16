import { AgentInfoSigned, AgentInfoPacked, Urls, AgentInfo } from '../src/agent_info'
import { KitsuneSignature, KitsuneSpace, KitsuneBin, KitsuneAgent } from '../src/kitsune'
import { aliceAgentVapor, aliceSecret } from './agents'
import { strict as assert } from 'assert'

describe('agent info signed', () => {

  const agent_info_packed:AgentInfoPacked|Error = AgentInfoPacked.decode(new AgentInfo(aliceAgentVapor).pack())
  if (agent_info_packed instanceof Error) {
    console.error(agent_info_packed)
    throw agent_info_packed
  }

  // console.log(Buffer.from(agent_info_packed.encode()).toString('base64'))
  //
  // let nacl_keypair = sign.keyPair.fromSecretKey(aliceSecretKey)
  // // console.log(Buffer.from(nacl_keypair.publicKey).toString('base64'))
  // // assert.deepEqual(
  // //  nacl_keypair.publicKey,
  // //  alice_pub_key,
  // // )
  // // assert.deepEqual(
  // //  nacl_keypair.secretKey,
  // //  alice_secret,
  // // )
  //
  // assert.deepEqual(
  //   new AgentInfoPacked(Uint8Array.from([
  //     222, 0, 4, 165, 115, 112, 97, 99, 101, 222, 0, 1, 165, 118, 97, 108, 117,
  //     101, 196, 32, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
  //     19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 165, 97, 103,
  //     101, 110, 116, 222, 0, 1, 165, 118, 97, 108, 117, 101, 196, 32, 246, 246,
  //     140, 64, 123, 91, 151, 219, 30, 50, 225, 68, 149, 187, 141, 28, 233, 11,
  //     131, 171, 7, 35, 33, 145, 98, 198, 240, 123, 70, 188, 224, 8, 164, 117,
  //     114, 108, 115, 146, 179, 104, 116, 116, 112, 115, 58, 47, 47, 101, 120,
  //     97, 109, 112, 108, 101, 46, 99, 111, 109, 175, 104, 116, 116, 112, 115,
  //     58, 47, 47, 102, 111, 111, 46, 99, 111, 109, 172, 115, 105, 103, 110, 101,
  //     100, 95, 97, 116, 95, 109, 115, 203, 66, 119, 82, 198, 106, 217, 48, 0
  //   ])),
  //   agent_info_packed
  // )
  //
  // let nacl_signed_message = sign.detached(agent_info_packed.encode(), aliceSecretKey)
  // let nacl_signature = nacl_signed_message.slice(0, sign.signatureLength)
  // let nacl_message = nacl_signed_message.slice(sign.signatureLength)
  //
  // console.log(nacl_signature)
  //
  // assert.deepEqual(
  //  agent_info_packed.encode(),
  //  nacl_message,
  // )
  //
  // const signature_bytes:KitsuneSignature.Encoded = Uint8Array.from(nacl_signature)
  // const signature:KitsuneSignature|Error = KitsuneSignature.decode(signature_bytes)
  //
  // if (signature instanceof Error) {
  //   console.error(signature)
  //   throw signature
  // }
  //
  // const agent_info_signed:AgentInfoSigned = {
  //   signature: signature,
  //   agent: alice.agent,
  //   agent_info: agent_info_packed
  // }
  //
  // const wasm_key_manager_keys = new KeyManager(Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
  // console.log(wasm_key_manager_keys)
  // console.log(agent_info_signed.agent.encode())
  // console.log(KeyManager.verifyWithPublicKey( agent_info_signed.agent_info.encode(), agent_info_signed.agent.encode(), agent_info_signed.signature.encode() ))
})
