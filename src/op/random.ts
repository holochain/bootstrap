import * as D from 'io-ts/Decoder'
import * as Kitsune from '../kitsune/kitsune'
import * as MP from '../msgpack/msgpack'
import { pipe } from 'fp-ts/lib/pipeable'
import * as E from 'fp-ts/lib/Either'
import { Uint8ArrayDecoder } from '../io/io'
import * as List from './list'
import * as Get from './get'

export const query = D.type({
 space: Kitsune.Space,
 limit: D.number,
})
export type Query = D.TypeOf<typeof query>

export const querySafe: D.Decoder<MessagePackData, Query> = {
 decode: (a:MessagePackData) => {
  return pipe(
   Uint8ArrayDecoder.decode(a),
   E.chain(value => MP.messagePackDecoder.decode(value)),
   E.chain(value => query.decode(value)),
  )
 }
}

// shuffle with a lazy generator because the list may be very long
function *shuffle(array) {
 var i = array.length
 while (i--) {
  yield array.splice(
   Math.floor(
    Math.random() * (i + 1)
   ),
   1,
  )[0]
 }
}

export async function _random(query:Query):MessagePackData {
 let { space, limit } = query
 let everyone = shuffle(await List._list(space))
 let keys = []
 let i = 0
 let k:Kitsune.Agent
 while (i < limit) {
  k = everyone.next().value
  if (k) {
   keys[i] = k
   i++
  }
  else {
   break
  }
 }

 return await Promise.all(keys.map(k => Get._get(Uint8Array.from([...space, ...k]))))
}

export async function random(input:MP.MessagePackData):MP.MessagePackData|Error {
 let result = await pipe(
  querySafe.decode(input),
  E.chain(async queryValue => D.success(MP.encode(await _random(queryValue)))),
  E.mapLeft(v => Error(JSON.stringify(v))),
 )
 if (E.isLeft(result)) {
  return result.left
 }
 else {
  return result.right
 }
}
