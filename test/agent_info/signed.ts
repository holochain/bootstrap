import { Urls, AgentInfo, AgentInfoPacked } from '../../src/agent_info/info'
import { AgentInfoSignedRaw, agentInfoSignedRawSafe, agentInfoSignedSafe } from '../../src/agent_info/signed'
import { KitsuneSignature, KitsuneSpace, KitsuneBin, KitsuneAgent } from '../../src/kitsune/kitsune'
import { bobSignedAliceRaw, aliceAgentVapor, aliceSecret, aliceAgentVaporSignedRaw } from '../fixture/agents'
import { bobSignedAlicePostBody, aliceVaporEncodedInfo, aliceVaporPostBody, aliceVaporPostBodyBadSignature } from '../fixture/requests'
import { strict as assert } from 'assert'
import { encode } from '../../src/msgpack/msgpack'
import { isRight, isLeft } from 'fp-ts/lib/Either'

describe('agent info signed', () => {

 it('should decode AgentInfoSignedRaw correctly', () => {
  assert.deepEqual(
   encode(aliceAgentVaporSignedRaw),
   aliceVaporPostBody
  )

  assert.ok(isRight(agentInfoSignedRawSafe.decode(aliceVaporPostBody)))

  // any bad signature must not be valid
  assert.ok(isLeft(agentInfoSignedRawSafe.decode(aliceVaporPostBodyBadSignature)))
 })

 it('should decode agentInfoSigned correctly', () => {
  assert.ok(isRight(agentInfoSignedSafe.decode(aliceVaporPostBody)))

  // bob must not be allowed to sign alice's info
  assert.ok(isLeft(agentInfoSignedSafe.decode(bobSignedAlicePostBody)))
 })

})
