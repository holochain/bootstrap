import { AgentInfo } from '../../src/agent_info/info'
import { aliceVaporPostBody, aliceVaporPostBodyCorrupted } from '../fixture/requests'
import { strict as assert } from 'assert'

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
})
