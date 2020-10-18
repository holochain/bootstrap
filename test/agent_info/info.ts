import { AgentInfo, url, urls } from '../../src/agent_info/info'
import { aliceVaporPostBody, aliceVaporPostBodyCorrupted } from '../fixture/requests'
import { strict as assert } from 'assert'
import { isRight, isLeft } from 'fp-ts/lib/Either'

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
})

describe('agent info data', () => {

 it('should decode from msgpack binary data', () => {
  const valid_agent_info:AgentInfo|Error = AgentInfo.unpack(aliceVaporPostBody)
  assert.ok(!(valid_agent_info instanceof Error))
  assert.ok(valid_agent_info)

  const fail_agent_info:AgentInfo|Error = AgentInfo.unpack(aliceVaporPostBodyCorrupted)
  assert.ok(fail_agent_info instanceof Error)
  assert.deepEqual(
   fail_agent_info,
   RangeError('Extra 144 of 145 byte(s) found at buffer[1]')
  )
 })

 it('should round trip deterministically', () => {
  assert.deepEqual(
   aliceVaporPostBody,
   AgentInfo.pack((AgentInfo.unpack(aliceVaporPostBody) as AgentInfo))
  )
 })
})
