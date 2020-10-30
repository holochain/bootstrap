import * as fetch from 'node-fetch'
import * as Agents from '../fixture/agents'
import { vaporChatSpace, wikiSpace, emptySpace } from '../fixture/spaces'
import * as MP from '../../src/msgpack/msgpack'
import { strict as assert } from 'assert'
import * as Kitsune from '../../src/kitsune/kitsune'

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

  let doApi = async (op:string, body:unknown):Promise<unknown> => {
   let buffer = await fetch(url, {
    method: 'post',
    body: MP.encode(body),
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
   return MP.decode(Uint8Array.from(buffer))
  }

  // put alice and bob
  for (let agent of [Agents.aliceAgentVaporSignedRaw, Agents.aliceAgentWikiSignedRaw, Agents.bobAgentVaporSignedRaw]) {
   assert.deepEqual(
    await doApi('put', agent),
    null
   )
  }

  // vapor chat list pubkeys
  let vaporPubKeys = await doApi('list', vaporChatSpace)
  assert.deepEqual(
   vaporPubKeys,
   [ Agents.bob.publicKey, Agents.alice.publicKey ].map(Kitsune.fromBytes),
  )
  // wiki list pubkeys
  let wikiPubKeys = await doApi('list', wikiSpace)
  assert.deepEqual(
   wikiPubKeys,
   [ Agents.alice.publicKey ].map(Kitsune.fromBytes),
  )
  // empty list pubkeys
  let emptyPubKeys = await doApi('list', emptySpace)
  assert.deepEqual(
   emptyPubKeys,
   [ ],
  )

  // gets all work
  let aliceVaporKey = new Uint8Array([...vaporChatSpace, ...Kitsune.fromBytes(Agents.alice.publicKey)])
  let aliceVaporValue = await doApi('get', aliceVaporKey)
  assert.deepEqual(
   Agents.aliceAgentVaporSignedRaw,
   aliceVaporValue,
  )
  let bobVaporKey = new Uint8Array([...vaporChatSpace, ...Kitsune.fromBytes(Agents.bob.publicKey)])
  let bobVaporValue = await doApi('get', bobVaporKey)
  assert.deepEqual(
   Agents.bobAgentVaporSignedRaw,
   bobVaporValue,
  )
  let aliceWikiKey = new Uint8Array([...wikiSpace, ...Kitsune.fromBytes(Agents.alice.publicKey)])
  let aliceWikiValue = await doApi('get', aliceWikiKey)
  assert.deepEqual(
   Agents.aliceAgentWikiSignedRaw,
   aliceWikiValue,
  )
  let nobodyKey = new Uint8Array([...emptySpace, ...Kitsune.fromBytes(Agents.alice.publicKey)])
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
    [ MP.encode(Agents.bobAgentVaporSignedRaw) ]
   )
  } catch (e) {
   assert.deepEqual(
    randomOne,
    [ MP.encode(Agents.aliceAgentVaporSignedRaw) ]
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
    [
     MP.encode(Agents.aliceAgentVaporSignedRaw),
     MP.encode(Agents.bobAgentVaporSignedRaw),
    ],
   )
  } catch (e) {
   assert.deepEqual(
    randomTwo,
    [
     MP.encode(Agents.bobAgentVaporSignedRaw),
     MP.encode(Agents.aliceAgentVaporSignedRaw),
    ],
   )
  }

  let randomOversubscribed = await doApi('random', {
   space: wikiSpace,
   limit: 2,
  })
  assert.deepEqual(
   randomOversubscribed,
   [ MP.encode(Agents.aliceAgentWikiSignedRaw) ],
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
