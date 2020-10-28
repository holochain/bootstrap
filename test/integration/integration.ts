import * as fetch from 'node-fetch'
import { alicePublic, bobPublic, bobAgentVaporSignedRaw, aliceAgentVaporSignedRaw, aliceAgentWikiSignedRaw } from '../fixture/agents'
import { aliceVaporPutBody, aliceWikiPutBody, bobVaporPutBody } from '../fixture/requests'
import { vaporChatSpace, wikiSpace } from '../fixture/spaces'
import { encode, decode, MessagePackData } from '../../src/msgpack/msgpack'
import { strict as assert } from 'assert'

describe('integration tests', () => {

 let url = 'http://127.0.0.1:8787'

 it('should GET correctly', async function() {
  this.timeout(0)

  let ok = await fetch(url).then(res => res.text())

  assert.deepEqual(
   'OK',
   ok,
  )

 })

 it('should POST correctly', async function() {

  // needs an extended timeout to post everything
  this.timeout(0)

  let doApi = async (op:string, body:MessagePackData):Promise<unknown> => {
   let buffer = await fetch(url, {
    method: 'post',
    body: encode(body),
    headers: {
     'Content-Type': 'application/octet',
     'X-Op': op,
    },
   })
   .then(res => {
    // For debugging errors.
    if (res.status !== 200) {
     console.log(res)
    }
    return res.buffer()
   })
   .catch(err => console.log(err))
   return decode(Uint8Array.from(buffer))
  }

  // put alice and bob
  for (let agent of [aliceVaporPutBody, aliceWikiPutBody, bobVaporPutBody]) {
   assert.deepEqual(
    await doApi('put', agent),
    null
   )
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
  // empty list pubkeys
  let emptyPubKeys = await doApi('list', emptySpace)
  assert.deepEqual(
   emptyPubKeys,
   [ ],
  )

  // gets all work
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
  let nobodyKey = new Uint8Array([...emptySpace, ...alicePublic])
  let nobodyValue = await doApi('get', nobodyKey)
  assert.deepEqual(
   null,
   nobodyValue,
  )

  // random list
  let randomOne = await doApi('random', {
   space: vaporChatSpace,
   limit: 1,
  })
  // alice or bob is fine
  try {
   assert.deepEqual(
    randomOne,
    [ bobVaporPutBody ]
   )
  } catch (e) {
   assert.deepEqual(
    randomOne,
    [ aliceVaporPutBody ]
   )
  }

  let randomTwo = await doApi('random', {
   space: vaporChatSpace,
   limit: 2,
  })
  // either order is fine but we need both
  try {
   assert.deepEqual(
    randomTwo,
    [ aliceVaporPutBody, bobVaporPutBody ],
   )
  } catch (e) {
   assert.deepEqual(
    randomTwo,
    [ bobVaporPutBody, aliceVaporPutBody ],
   )
  }

  let randomOversubscribed = await doApi('random', {
   space: wikiSpace,
   limit: 2,
  })
  assert.deepEqual(
   randomOversubscribed,
   [ aliceWikiPutBody ],
  )

  let randomEmpty = await doApi('random', {
   space: emptySpace,
   limit: 2,
  })
  assert.deepEqual(
   randomEmpty,
   [ ],
  )

 })

})
