import * as D from 'io-ts/Decoder'
import * as E from 'fp-ts/lib/Either'
import * as Kitsune from '../kitsune/kitsune'
import * as MP from '../msgpack/msgpack'
import * as IO from '../io/io'
import * as List from './list'
import * as Get from './get'
import { pipe } from 'fp-ts/lib/pipeable'

// One query for random agents for a specific space.
// Up to `limit` agents will be returned without pagination.
export const Query = D.type({
 space: Kitsune.Space,
 limit: D.number,
})
export type Query = D.TypeOf<typeof Query>

// Decoded query from messagepack data.
export const QuerySafe: D.Decoder<MP.MessagePackData, Query> = {
 decode: (a:MP.MessagePackData) => {
  return pipe(
   IO.Uint8ArrayDecoder.decode(a),
   E.chain(value => MP.messagePackDecoder.decode(value)),
   E.chain(value => Query.decode(value)),
  )
 }
}

// Shuffle with a lazy generator because the list may be very long internally.
// Allows us to stop shuffling after `limit` entries have been returned.
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
 // Need to be random over the complete list for the whole space even if we use
 // a generator to shuffle, otherwise we won't ever return agents after the
 // first page (1000 items on cloudflare).
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
