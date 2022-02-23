import * as fetch from 'node-fetch'
import { assert } from 'chai'
import * as Agents from '../test/fixture/agents'
import { keypair } from '../test/fixture/crypto'
import * as Crypto from '../src/crypto/crypto'
import { vaporChatSpace, wikiSpace, emptySpace } from '../test/fixture/spaces'
import * as MP from '../src/msgpack/msgpack'
import * as Kitsune from '../src/kitsune/kitsune'
import * as _ from 'lodash'

describe('integration tests', () => {
  let url = 'http://127.0.0.1:8787'

  it('should GET correctly', async function () {
    this.timeout(0)

    let ok = await fetch(url).then((res) => res.text())

    assert.deepEqual('OK', ok)
  })

  it('should handle POST errors', async function () {
    // needs an extended timeout to post everything
    this.timeout(0)

    let errApi = async (op: string, body: unknown): Promise<Response> => {
      return await fetch(url, {
        method: 'post',
        body: MP.encode(body),
        headers: {
          'Content-Type': 'application/octet',
          'X-Op': op,
        },
      })
        // .then(_ => assert.ok(false))
        .catch((err) => console.log('we WANT an error here', err))
    }

    // any bad signature must not POST
    let badSignature = _.cloneDeep(Agents.aliceAgentVaporSignedRaw)
    badSignature.signature = new Uint8Array(
      Array(Kitsune.signatureLength),
    ).fill(1)

    let badSignatureErr = await errApi('put', badSignature)
    assert.deepEqual(badSignatureErr.status, 500)

    assert.ok(
      (await badSignatureErr.text()).includes(
        'Signature does not verify for agent and agent_info data.',
      ),
    )

    let badSpace = Uint8Array.from([1, 2, 3])

    let badRandomQuery = {
      space: badSpace,
      limit: 5,
    }
    let badRandomQueryErr = await errApi('random', badRandomQuery)
    assert.deepEqual(badRandomQueryErr.status, 500)
    assert.ok(
      (await badRandomQueryErr.text()).includes('length must be exactly 36'),
    )
  })

  it('should POST/proxy_list correctly', async function () {
    const raw = await fetch(url, {
      method: 'POST',
      body: new Uint8Array(0),
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Op': 'proxy_list',
      },
    })

    if (raw.status !== 200) {
      throw new Error(JSON.stringify(raw))
    }

    const buffer = await raw.buffer()
    const res = MP.decode(buffer)

    assert.deepEqual([
      'https://test.holo.host/this/is/a/test?noodle=true',
      'https://test2.holo.host/another/test/this/is?a=b#yada',
    ], res.sort())
  })

  it.only('should trigger_scheduled / metrics correctly', async function () {
    this.timeout(0)

    for (let s = 0; s < 3; ++s) {
      let space = Uint8Array.from(Array(36).fill(s))
      for (let a = 0; a < 3; ++a) {
        const {publicKey, secretKey} = keypair()
        const info = {
          space,
          agent: Agents.publicKeyToKitsuneAgent(publicKey),
          urls: ['https://foo.com'],
          signed_at_ms: Date.now(),
          expires_after_ms: 100000,
          meta_info: new Uint8Array(0),
        }
        const infoEnc = MP.encode(info)
        const signed = MP.encode({
          signature: Crypto.sign(infoEnc, secretKey),
          agent: info.agent,
          agent_info: infoEnc,
        })
        await fetch(url, {
          method: 'POST',
          body: signed,
          headers: {
            'X-Op': 'put',
          },
        })
      }
    }

    for (let i = 0; i < 3; ++i) {
      await fetch(url, {
        method: 'POST',
        body: new Uint8Array(0),
        headers: {
          'X-Op': 'trigger_scheduled',
        },
      })
    }

    const raw = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Op': 'metrics',
      },
    })

    if (raw.status !== 200) {
      throw new Error(JSON.stringify(raw))
    }

    const res = JSON.parse((new TextDecoder()).decode(await raw.buffer()))
    console.log(res)

    // make sure we only got 1 entry for the three triggers above
    assert.equal(1, res.data.length)

    // make sure we have at least the agents we added
    assert(res.data[0][1] >= 9)

    // make sure we have at least the spaces we added
    assert(res.data[0][2] >= 3)

    // make sure we recorded the two proxy urls in the proxy pool
    assert.equal(2, res.data[0][3])
  })

  it('should POST correctly', async function () {
    // needs an extended timeout to post everything
    this.timeout(0)

    let doApi = async (op: string, body: unknown): Promise<unknown> => {
      let buffer = await fetch(url, {
        method: 'post',
        body: MP.encode(body),
        headers: {
          'Content-Type': 'application/octet',
          'X-Op': op,
        },
      })
        .then((res) => {
          // For debugging errors.
          if (res.status !== 200) {
            console.log(res)
          }
          return res.buffer()
        })
        .catch((err) => console.log(err))

      return MP.decode(Uint8Array.from(buffer))
    }

    // now
    let now = await doApi('now', null)
    if (typeof now === 'number') {
      assert.ok(Number.isInteger(now))
      assert.ok(now > 1604318591241)
    } else {
      assert.ok(false, 'now not a number')
    }


    // put alice and bob
    for (let agent of [
      Agents.aliceAgentVaporSignedRaw,
      Agents.aliceAgentWikiSignedRaw,
      Agents.bobAgentVaporSignedRaw,
    ]) {
      let res = await doApi('put', agent)
      assert.deepEqual(res, null)
    }

    // random list
    let randomOne = await doApi('random', {
      space: vaporChatSpace,
      limit: 1,
    })
    // alice or bob is fine
    try {
      assert.deepEqual(randomOne, [MP.encode(Agents.bobAgentVaporSignedRaw)])
    } catch (e) {
      assert.deepEqual(randomOne, [MP.encode(Agents.aliceAgentVaporSignedRaw)])
    }

    let randomTwo = await doApi('random', {
      space: vaporChatSpace,
      limit: 2,
    })
    // either order is fine but we need both
    try {
      assert.deepEqual(randomTwo, [
        MP.encode(Agents.aliceAgentVaporSignedRaw),
        MP.encode(Agents.bobAgentVaporSignedRaw),
      ])
    } catch (e) {
      assert.deepEqual(randomTwo, [
        MP.encode(Agents.bobAgentVaporSignedRaw),
        MP.encode(Agents.aliceAgentVaporSignedRaw),
      ])
    }

    let randomOversubscribed = await doApi('random', {
      space: wikiSpace,
      limit: 2,
    })
    assert.deepEqual(randomOversubscribed, [
      MP.encode(Agents.aliceAgentWikiSignedRaw),
    ])
    let randomEmpty = await doApi('random', {
      space: emptySpace,
      limit: 2,
    })
    assert.deepEqual(randomEmpty, [])
  })
})
