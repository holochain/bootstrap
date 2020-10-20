import * as fetch from 'node-fetch'
import { alicePublic, bobAgentVaporSignedRaw } from '../fixture/agents'
import { aliceVaporPostBody, aliceWikiPostBody, bobVaporPostBody } from '../fixture/requests'
import { vaporChatSpace } from '../fixture/spaces'
import { encode, decode } from '../../src/msgpack/msgpack'
import { strict as assert } from 'assert'

describe('integration tests', () => {

 it('should POST correctly', () => {
  assert.deepEqual(
   encode(bobAgentVaporSignedRaw),
   bobVaporPostBody,
  )

  // put alice and bob
  for (let agent of [aliceVaporPostBody, aliceWikiPostBody, bobVaporPostBody]) {
   fetch('http://127.0.0.1:8787', {
    method: 'post',
    body: agent,
    headers: {
     'Content-Type': 'application/octet',
     'X-Op': 'put',
    },
   })
    .then(res => res.buffer())
    .then(buffer => console.log(buffer))
  }

  let bytes = fetch('http://127.0.0.1:8787', {
   method: 'post',
   body: vaporChatSpace,
   headers: {
   'Content-Type': 'application/octet',
   'X-Op': 'list',
   },
  })
   .then(res => res.buffer())

  let pubKeys = decode(Uint8Array.from(bytes))
  assert.deepEqual(
   pubKeys,
   [ alicePublic ]
  )
 })

})
