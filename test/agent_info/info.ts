import { AgentInfo, url, urls, agentInfoSafe } from '../../src/agent_info/info'
import { aliceAgentVapor } from '../fixture/agents'
import { aliceVaporEncodedInfo, aliceVaporEncodedInfoCorrupted, aliceVaporEncodedInfoMaliciousProperty } from '../fixture/requests'
import { strict as assert } from 'assert'
import { isRight, isLeft } from 'fp-ts/lib/Either'
import { encode } from '../../src/msgpack/msgpack'

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

 it('should decode packed data', () => {
  // We must decode valid agent info data.
  assert.ok(isRight(agentInfoSafe.decode(aliceVaporEncodedInfo)))

  // We must not decode anything with incorrect messagepack data.
  assert.ok(isLeft(agentInfoSafe.decode(aliceVaporEncodedInfoCorrupted)))

  // We must not decode anything with unexpected properties.
  assert.ok(isLeft(agentInfoSafe.decode(aliceVaporEncodedInfoMaliciousProperty)))
 })
})
