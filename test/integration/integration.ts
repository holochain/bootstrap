import * as fetch from 'node-fetch'
import { alicePublic, bobPublic, bobAgentVaporSignedRaw, aliceAgentVaporSignedRaw, aliceAgentWikiSignedRaw } from '../fixture/agents'
import { aliceVaporPutBody, aliceWikiPutBody, bobVaporPutBody } from '../fixture/requests'
import { vaporChatSpace, wikiSpace } from '../fixture/spaces'
import { encode, decode } from '../../src/msgpack/msgpack'
import { strict as assert } from 'assert'

describe('integration tests', () => {

 it('should POST correctly', async function() {

  // needs an extended timeout to post everything
  this.timeout(0)

  let url = 'http://127.0.0.1:8787'

  let doApi = async (op:string, body:Uint8Array):Promise<unknown> => {
   let buffer = await fetch(url, {
    method: 'post',
    body: body,
    headers: {
     'Content-Type': 'application/octet',
     'X-Op': op,
    },
   }).then(res => res.buffer())
   return decode(Uint8Array.from(buffer))
  }

  // put alice and bob
  for (let agent of [aliceVaporPutBody, aliceWikiPutBody, bobVaporPutBody]) {
   await doApi('put', agent)
  }

  // vapor chat list pubkeys
  let vaporPubKeys = await doApi('list', vaporChatSpace)
  assert.deepEqual(
   vaporPubKeys,
   [ alicePublic, bobPublic ],
  )

  // wiki list pubkeys
  let wikiPubKeys = await doApi('list', wikiSpace)
  assert.deepEqual(
   wikiPubKeys,
   [ alicePublic ],
  )

  let aliceVaporKey = new Uint8Array([...vaporChatSpace, ...alicePublic])
  let aliceVaporValue = await doApi('get', aliceVaporKey)
  assert.deepEqual(
   aliceAgentVaporSignedRaw,
   aliceVaporValue,
  )
  let bobVaporKey = new Uint8Array([...vaporChatSpace, ...bobPublic])
  let bobVaporValue = await doApi('get', bobVaporKey)
  assert.deepEqual(
   bobAgentVaporSignedRaw,
   bobVaporValue,
  )
  let aliceWikiKey = new Uint8Array([...wikiSpace, ...alicePublic])
  let aliceWikiValue = await doApi('get', aliceWikiKey)
  assert.deepEqual(
   aliceAgentWikiSignedRaw,
   aliceWikiValue,
  )

 })

})
