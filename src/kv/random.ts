import * as D from 'io-ts/Decoder'
import { kitsuneSpace } from '../kitsune/kitsune'
import { MessagePackData, encode, messagePackDecoder, messagePackData } from '../msgpack/msgpack'
import { pipe } from 'fp-ts/lib/pipeable'
import * as E from 'fp-ts/lib/Either'
import { Uint8ArrayDecoder } from '../io/io'
import { _list } from './list'
import { _get } from './get'

export const query = D.type({
 space: kitsuneSpace,
 limit: D.number,
})
export type Query = D.TypeOf<typeof query>

export const querySafe: D.Decoder<MessagePackData, Query> = {
 decode: (a:MessagePackData) => {
  return pipe(
   Uint8ArrayDecoder.decode(a),
   E.fold(
    errors => D.failure(a, JSON.stringify(errors)),
    value => pipe(
     messagePackDecoder.decode(value),
     E.fold(
      errors => D.failure(a, JSON.stringify(errors)),
      value => pipe(
       query.decode(value),
       E.fold(
        errors => D.failure(a, JSON.stringify(errors)),
        queryValue => D.success(queryValue),
       )
      )
     )
    )
   )
  )
 }
}

// shuffle with a lazy generator because the list may be very long
function *shuffle(array) {
    var i = array.length;
    while (i--) {
        yield array.splice(Math.floor(Math.random() * (i+1)), 1)[0];
    }
}

export async function _random(query:Query):MessagePackData {
 let { space, limit } = query
 let everyone = shuffle(await _list(space))
 let keys = []
 let i = 0
 let k:KitsuneAgent
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

 return await Promise.all(keys.map(k => _get(Uint8Array.from([...space, ...k]))))
}

export async function random(input:MessagePackData):MessagePackData|Error {
 return pipe(
  querySafe.decode(input),
  E.fold(
   errors => Error(JSON.stringify(errors)),
   async queryValue => encode(await _random(queryValue)),
  )
 )
}
