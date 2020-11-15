import { Urls, AgentInfo, AgentInfoPacked } from '../../src/agent_info/info'
import { AgentInfoSignedRaw, AgentInfoSignedRawSafe, AgentInfoSignedSafe } from '../../src/agent_info/signed'
import * as Kitsune from '../../src/kitsune/kitsune'
import * as Agents from '../fixture/agents'
import { strict as assert } from 'assert'
import * as MP from '../../src/msgpack/msgpack'
import { isRight, isLeft } from 'fp-ts/lib/Either'
import * as _ from 'lodash'
import * as Crypto from '../../src/crypto/crypto'

describe('agent info signed', () => {

 it('should decode AgentInfoSignedRaw correctly', () => {
  // Round tripts must work.
  assert.deepEqual(
   MP.decode(MP.encode(Agents.aliceAgentVaporSignedRaw)),
   Agents.aliceAgentVaporSignedRaw,
  )

  assert.ok(isRight(AgentInfoSignedRawSafe.decode(MP.encode(Agents.aliceAgentVaporSignedRaw))))

  // any bad signature must not be valid
  let badSignature = _.cloneDeep(Agents.aliceAgentVaporSignedRaw)
  badSignature.signature = new Uint8Array(Array(36)).fill(1)
  assert.ok(isLeft(AgentInfoSignedRawSafe.decode(MP.encode(badSignature))))
 })

 it('should decode agentInfoSigned correctly', () => {
  assert.ok(isRight(AgentInfoSignedSafe.decode(MP.encode(Agents.aliceAgentVaporSignedRaw))))

  // bob must not be allowed to sign alice's info
  let bobSignedAlice = _.cloneDeep(Agents.aliceAgentVaporSignedRaw)
  bobSignedAlice.signature = Crypto.sign(bobSignedAlice.agent_info, Agents.bob.secretKey)
  assert.ok(isLeft(AgentInfoSignedSafe.decode(MP.encode(bobSignedAlice))))
 })

})
