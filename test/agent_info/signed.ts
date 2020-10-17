import { Urls, AgentInfo, AgentInfoPacked } from '../../src/agent_info/info'
import { AgentInfoSigned } from '../../src/agent_info/signed'
import { KitsuneSignature, KitsuneSpace, KitsuneBin, KitsuneAgent } from '../../src/kitsune/kitsune'
import { aliceAgentVapor, aliceSecret } from '../fixture/agents'
import { aliceVaporPostBody } from '../fixture/requests'
import { strict as assert } from 'assert'

describe('agent info signed', () => {

 it('should verify packed info correctly', () => {

  const agent_info_packed:AgentInfoPacked = AgentInfo.pack(aliceAgentVapor)

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
  console.log(Buffer.from(aliceVaporPostBody).toString('base64'))
  assert.deepEqual(
    aliceVaporPostBody,
    agent_info_packed
  )
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
})
