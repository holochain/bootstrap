import { AgentInfo, url, urls, agentInfoSafe, signedAtMsSafe } from '../../src/agent_info/info'
import { aliceAgentVapor } from '../fixture/agents'
import { strict as assert } from 'assert'
import { isRight, isLeft, right } from 'fp-ts/lib/Either'
import * as MP from '../../src/msgpack/msgpack'
import * as _ from 'lodash'
import * as Agents from '../fixture/agents'

describe('agent info ts-io', () => {
 it('should decode url', () => {
  assert.ok(isRight(url.decode("foo")))
  assert.ok(isRight(url.decode("")))

  assert.ok(isLeft(url.decode(null)))
  assert.ok(isLeft(url.decode(1)))
 })

 it('should decode urls', () => {
  assert.ok(isRight(urls.decode([])))
  assert.ok(isRight(urls.decode(["foo"])))
  assert.ok(isRight(urls.decode([""])))
  assert.ok(isRight(urls.decode(["", "foo"])))

  assert.ok(isLeft(urls.decode("")))
  assert.ok(isLeft(urls.decode("foo")))
 })

 it('should decode signed_at_ms', () => {
  let past = Date.now() - 10
  assert.deepEqual(
   signedAtMsSafe.decode(past),
   right(past),
  )

  let now = Date.now()
  assert.deepEqual(
   signedAtMsSafe.decode(now),
   right(now),
  )

  let future = Date.now() + 10
  assert.ok(isLeft(signedAtMsSafe.decode(future)))

  let negative = -10
  assert.ok(isLeft(signedAtMsSafe.decode(negative)))
 })

 it('should decode packed data', () => {
  // We must decode valid agent info data.
  assert.ok(isRight(agentInfoSafe.decode(MP.encode(aliceAgentVapor))))

  // We must not decode anything with incorrect messagepack data.
  let aliceEncodedCorrupted = _.cloneDeep(Agents.aliceAgentVaporSignedRaw)
  aliceEncodedCorrupted.agent_info[0] = 0
  assert.ok(isLeft(agentInfoSafe.decode(MP.encode(aliceEncodedCorrupted))))

  // We must not decode anything with unexpected properties.
  let aliceMaliciousProperty = _.cloneDeep(Agents.aliceAgentVaporSignedRaw)
  aliceMaliciousProperty.bad = true
  assert.ok(isLeft(agentInfoSafe.decode(MP.encode(aliceMaliciousProperty))))
 })
})
