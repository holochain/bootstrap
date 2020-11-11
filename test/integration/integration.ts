import * as fetch from 'node-fetch'
import * as Agents from '../fixture/agents'
import { vaporChatSpace, wikiSpace, emptySpace } from '../fixture/spaces'
import * as MP from '../../src/msgpack/msgpack'
import { strict as assert } from 'assert'
import * as Kitsune from '../../src/kitsune/kitsune'
import * as _ from 'lodash'

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

 it('should handle POST errors', async function() {

  // needs an extended timeout to post everything
  this.timeout(0)

  let errApi = async (op:string, body:unknown):Promise<Response> => {
   return await fetch(url, {
    method: 'post',
    body: MP.encode(body),
    headers: {
     'Content-Type': 'application/octet',
     'X-Op': op,
    },
   })
   // .then(_ => assert.ok(false))
   .catch(err => console.log('we WANT an error here', err))
  }

  // any bad signature must not POST
  let badSignature = _.cloneDeep(Agents.aliceAgentVaporSignedRaw)
  badSignature.signature = new Uint8Array(Array(Kitsune.signatureLength)).fill(1)

  let badSignatureErr = await errApi('put', badSignature)
  assert.deepEqual(
   badSignatureErr.status,
   500,
  )

  assert.ok(
   (await badSignatureErr.text())
   .includes('Signature does not verify for agent and agent_info data.')
  )

  let badSpace = Uint8Array.from([1, 2, 3])

  let badRandomQuery = {
   space: badSpace,
   limit: 5,
  }
  let badRandomQueryErr = await errApi('random', badRandomQuery)
  assert.deepEqual(
   badRandomQueryErr.status,
   500,
  )
  assert.ok(
   (await badRandomQueryErr.text())
   .includes('length must be exactly 36')
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

  // now
  let now = await doApi('now', null)
  if (typeof now === 'number') {
   assert.ok(Number.isInteger(now))
   assert.ok(now > 1604318591241)
  }
  else {
   assert.ok(false, 'now not a number')
  }

  // put alice and bob
  for (let agent of [Agents.aliceAgentVaporSignedRaw, Agents.aliceAgentWikiSignedRaw, Agents.bobAgentVaporSignedRaw]) {
   assert.deepEqual(
    await doApi('put', agent),
    null
   )
  }

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
