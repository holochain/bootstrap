import { Urls, AgentInfo, AgentInfoPacked } from '../../src/agent_info/info'
import { AgentInfoSignedRaw, agentInfoSignedRawSafe, agentInfoSignedSafe } from '../../src/agent_info/signed'
import * as Kitsune from '../../src/kitsune/kitsune'
import * as Agents from '../fixture/agents'
import { strict as assert } from 'assert'
import * as MP from '../../src/msgpack/msgpack'
import { isRight, isLeft } from 'fp-ts/lib/Either'
import * as _ from 'lodash'
import { Ed25519 } from '../../src/crypto/crypto'

describe('agent info signed', () => {

 it('should decode AgentInfoSignedRaw correctly', () => {
  // Round tripts must work.
  assert.deepEqual(
   MP.decode(MP.encode(Agents.aliceAgentVaporSignedRaw)),
   Agents.aliceAgentVaporSignedRaw,
  )

  assert.ok(isRight(agentInfoSignedRawSafe.decode(MP.encode(Agents.aliceAgentVaporSignedRaw))))

  // any bad signature must not be valid
  let badSignature = _.cloneDeep(Agents.aliceAgentVaporSignedRaw)
  badSignature.signature = new Uint8Array(Array(36)).fill(1)
  assert.ok(isLeft(agentInfoSignedRawSafe.decode(MP.encode(badSignature))))
 })

 it('should decode agentInfoSigned correctly', () => {
  assert.ok(isRight(agentInfoSignedSafe.decode(MP.encode(Agents.aliceAgentVaporSignedRaw))))

  // bob must not be allowed to sign alice's info
  let bobSignedAlice = _.cloneDeep(Agents.aliceAgentVaporSignedRaw)
  bobSignedAlice.signature = Ed25519.sign(bobSignedAlice.agent_info, Agents.bob.secretKey)
  assert.ok(isLeft(agentInfoSignedSafe.decode(MP.encode(bobSignedAlice))))
 })

})
