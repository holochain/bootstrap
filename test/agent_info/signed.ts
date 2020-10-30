import { Urls, AgentInfo, AgentInfoPacked } from '../../src/agent_info/info'
import { AgentInfoSignedRaw, agentInfoSignedRawSafe, agentInfoSignedSafe } from '../../src/agent_info/signed'
import * as Kitsune from '../../src/kitsune/kitsune'
import * as Agents from '../fixture/agents'
import * as Requests from '../fixture/requests'
import { strict as assert } from 'assert'
import * as MP from '../../src/msgpack/msgpack'
import { isRight, isLeft } from 'fp-ts/lib/Either'

describe('agent info signed', () => {

 it('should decode AgentInfoSignedRaw correctly', () => {
  // Round tripts must work.
  assert.deepEqual(
   MP.decode(MP.encode(Agents.aliceAgentVaporSignedRaw)),
   Agents.aliceAgentVaporSignedRaw,
  )

  assert.ok(isRight(agentInfoSignedRawSafe.decode(MP.encode(Agents.aliceAgentVaporSignedRaw))))

  // any bad signature must not be valid
  assert.ok(isLeft(agentInfoSignedRawSafe.decode(Requests.aliceVaporPutBodyBadSignature)))
 })

 it('should decode agentInfoSigned correctly', () => {
  assert.ok(isRight(agentInfoSignedSafe.decode(MP.encode(Agents.aliceAgentVaporSignedRaw))))

  // bob must not be allowed to sign alice's info
  assert.ok(isLeft(agentInfoSignedSafe.decode(Requests.bobSignedAlicePostBody)))
 })

})
