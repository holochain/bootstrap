import * as D from 'io-ts/Decoder'
import * as E from 'fp-ts/lib/Either'
import * as Kitsune from '../kitsune/kitsune'
import * as MP from '../msgpack/msgpack'
import * as IO from '../io/io'
import * as List from './list'
import * as Get from './get'
import { pipe } from 'fp-ts/lib/pipeable'

export const query = D.type({
 space: Kitsune.Space,
 limit: D.number,
})
export type Query = D.TypeOf<typeof query>

export const querySafe: D.Decoder<MP.MessagePackData, Query> = {
 decode: (a:MP.MessagePackData) => {
  return pipe(
   IO.Uint8ArrayDecoder.decode(a),
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

export async function random(query:Query):MP.MessagePackData {
 let { space, limit } = query
 let everyone = shuffle(await List.list(space))
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
 return await Promise.all(keys.map(k => Get.get(Uint8Array.from([...space, ...k]))))
}
