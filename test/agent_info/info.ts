import * as AgentInfo from '../../src/agent_info/info'
import { aliceAgentVapor } from '../fixture/agents'
import { strict as assert } from 'assert'
import { isRight, isLeft, right } from 'fp-ts/lib/Either'
import * as MP from '../../src/msgpack/msgpack'
import * as _ from 'lodash'
import * as Agents from '../fixture/agents'

describe('agent info ts-io', () => {
 it('should decode url', () => {
  assert.ok(isRight(AgentInfo.Url.decode("foo")))
  assert.ok(isRight(AgentInfo.Url.decode("")))

  assert.ok(isLeft(AgentInfo.Url.decode(null)))
  assert.ok(isLeft(AgentInfo.Url.decode(1)))
  // There is a max size limit on a url.
  assert.ok(isLeft(AgentInfo.Url.decode('a'.repeat(5000))))
  // é is a multibyte character so the string length is more restricted than the
  // utf8 byte length.
  assert.ok(isLeft(AgentInfo.Url.decode('é'.repeat(2000))))
 })

 it('should decode urls', () => {
  assert.ok(isRight(AgentInfo.Urls.decode([])))
  assert.ok(isRight(AgentInfo.Urls.decode(["foo"])))
  assert.ok(isRight(AgentInfo.Urls.decode([""])))
  assert.ok(isRight(AgentInfo.Urls.decode(["", "foo"])))
  assert.ok(isRight(AgentInfo.Urls.decode(Array(AgentInfo.MAX_URLS).fill('a'))))

  assert.ok(isLeft(AgentInfo.Urls.decode("")))
  assert.ok(isLeft(AgentInfo.Urls.decode("foo")))
  assert.ok(isLeft(AgentInfo.Urls.decode(Array(AgentInfo.MAX_URLS + 1).fill('a'))))
 })

 it('should decode times', () => {
  // There should be some threshold on now that allows different agent times.
  assert.ok(AgentInfo.now() > Date.now())

  let past = AgentInfo.now() - 10
  assert.deepEqual(
   AgentInfo.SignedAtMsSafe.decode(past),
   right(past),
  )

  let now = AgentInfo.now()
  assert.deepEqual(
   AgentInfo.SignedAtMsSafe.decode(now),
   right(now),
  )

  // Fractional times cannot be accepted.
  let fractionalMs = 1.1
  assert.ok(isLeft(AgentInfo.SignedAtMsSafe.decode(fractionalMs)))
  assert.ok(isLeft(AgentInfo.ExpiresAfterMsSafe.decode(fractionalMs)))

  // Future times cannot be accepted.
  let future = AgentInfo.now() + 10
  assert.ok(isLeft(AgentInfo.SignedAtMsSafe.decode(future)))

  // Negative times cannot be accepted.
  let negative = -10
  assert.ok(isLeft(AgentInfo.SignedAtMsSafe.decode(negative)))
  assert.ok(isLeft(AgentInfo.ExpiresAfterMsSafe.decode(negative)))

  // Expiry times cannot be too short.
  let shortExpiry = AgentInfo.MIN_EXPIRES - 1
  assert.ok(isLeft(AgentInfo.ExpiresAfterMsSafe.decode(shortExpiry)))

  // Expiry times cannot be too long.
  let longExpiry = AgentInfo.MAX_EXPIRES + 1
  assert.ok(isLeft(AgentInfo.ExpiresAfterMsSafe.decode(longExpiry)))

  // Expiry times must be just right.
  assert.ok(isRight(AgentInfo.ExpiresAfterMsSafe.decode(AgentInfo.MIN_EXPIRES)))
  assert.ok(isRight(AgentInfo.ExpiresAfterMsSafe.decode(AgentInfo.MAX_EXPIRES)))
 })

 it('should decode packed data', () => {
  // We must decode valid agent info data.
  assert.ok(isRight(AgentInfo.AgentInfoSafe.decode(MP.encode(aliceAgentVapor))))

  // We must not decode anything with incorrect messagepack data.
  let aliceEncodedCorrupted = _.cloneDeep(Agents.aliceAgentVaporSignedRaw)
  aliceEncodedCorrupted.agent_info[0] = 0
  assert.ok(isLeft(AgentInfo.AgentInfoSafe.decode(MP.encode(aliceEncodedCorrupted))))

  // We must not decode anything with unexpected properties.
  let aliceMaliciousProperty = _.cloneDeep(Agents.aliceAgentVaporSignedRaw)
  aliceMaliciousProperty.bad = true
  assert.ok(isLeft(AgentInfo.AgentInfoSafe.decode(MP.encode(aliceMaliciousProperty))))
 })
})
