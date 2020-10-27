import * as fetch from 'node-fetch'
import { alicePublic, bobPublic, bobAgentVaporSignedRaw, aliceAgentVaporSignedRaw, aliceAgentWikiSignedRaw } from '../fixture/agents'
import { aliceVaporPutBody, aliceWikiPutBody, bobVaporPutBody } from '../fixture/requests'
import { vaporChatSpace, wikiSpace } from '../fixture/spaces'
import { encode, decode, MessagePackData } from '../../src/msgpack/msgpack'
import { strict as assert } from 'assert'

describe('integration tests', () => {

 it('should POST correctly', async function() {

  // needs an extended timeout to post everything
  this.timeout(0)

  let url = 'http://127.0.0.1:8787'

  let doApi = async (op:string, body:MessagePackData):Promise<unknown> => {
   let buffer = await fetch(url, {
    method: 'post',
    body: body,
    headers: {
     'Content-Type': 'application/octet',
     'X-Op': op,
    },
   })
   .then(res => {
    console.log(res)
    return res.buffer()
   })
   .catch(err => console.log(err))
   console.log(buffer)
   return decode(Uint8Array.from(buffer))
  }

  // put alice and bob
  for (let agent of [aliceVaporPutBody, aliceWikiPutBody, bobVaporPutBody]) {
   assert.deepEqual(
    await doApi('put', agent),
    null
   )
  }

  // // vapor chat list pubkeys
  // let vaporPubKeys = await doApi('list', vaporChatSpace)
  // assert.deepEqual(
  //  vaporPubKeys,
  //  [ alicePublic, bobPublic ],
  // )
  // // wiki list pubkeys
  // let wikiPubKeys = await doApi('list', wikiSpace)
  // assert.deepEqual(
  //  wikiPubKeys,
  //  [ alicePublic ],
  // )
  //
  // // gets all work
  // let aliceVaporKey = new Uint8Array([...vaporChatSpace, ...alicePublic])
  // let aliceVaporValue = await doApi('get', aliceVaporKey)
  // assert.deepEqual(
  //  aliceAgentVaporSignedRaw,
  //  aliceVaporValue,
  // )
  // let bobVaporKey = new Uint8Array([...vaporChatSpace, ...bobPublic])
  // let bobVaporValue = await doApi('get', bobVaporKey)
  // assert.deepEqual(
  //  bobAgentVaporSignedRaw,
  //  bobVaporValue,
  // )
  // let aliceWikiKey = new Uint8Array([...wikiSpace, ...alicePublic])
  // let aliceWikiValue = await doApi('get', aliceWikiKey)
  // assert.deepEqual(
  //  aliceAgentWikiSignedRaw,
  //  aliceWikiValue,
  // )
  //
  // // random list
  // let randomOne = await doApi('random', encode({
  //  space: vaporChatSpace,
  //  limit: 1,
  // }))
  // // alice or bob is fine
  // try {
  //  assert.deepEqual(
  //   randomOne,
  //   [ bobVaporPutBody ]
  //  )
  // } catch (e) {
  //  assert.deepEqual(
  //   randomOne,
  //   [ aliceVaporPutBody ]
  //  )
  // }
  //
  // let randomTwo = await doApi('random', encode({
  //  space: vaporChatSpace,
  //  limit: 2,
  // }))
  // // either order is fine but we need both
  // try {
  //  assert.deepEqual(
  //   randomTwo,
  //   [ aliceVaporPutBody, bobVaporPutBody ],
  //  )
  // } catch (e) {
  //  assert.deepEqual(
  //   randomTwo,
  //   [ bobVaporPutBody, aliceVaporPutBody ],
  //  )
  // }
  //
  // let randomOversubscribed = await doApi('random', encode({
  //  space: wikiSpace,
  //  limit: 2,
  // }))
  // assert.deepEqual(
  //  randomOversubscribed,
  //  [ aliceWikiPutBody ],
  // )

 })

})
