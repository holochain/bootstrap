// import * as D from "io-ts/Decoder"
// import { kitsuneSpace } from '../kitsune/kitsune'
// import { MessagePackData, encode } from '../msgpack/msgpack'
// import { pipe } from 'fp-ts/lib/pipeable'

export const query = D.type({
 space: kitsuneSpace,
 limit: t.number,
})
export type Query = D.TypeOf<typeof query>

function *shuffle(array) {
    var i = array.length;
    while (i--) {
        yield array.splice(Math.floor(Math.random() * (i+1)), 1)[0];
    }
}

export function _random(query:Query):MessagePackData {
 let { space, limit } = query

 everyone = shuffle(_listSpace(space))
 keys = []
 let i = 0
 let k:KitsuneAgent
 while (i < count) {
  k = everyone.next().value
  if (k) {
   keys += k
   i++
  }
  else {
   break
  }
 }

 return keys.map(k => _get(Uint8Array.from([...space, ...k])))
}

export async function random(input:MessagePackData):MessagePackData|Error {
 return pipe(
  query.decode(input),
  E.fold(
   errors => Error(JSON.stringify(errors)),
   queryValue => encode(await _random(queryValue)),
  )
 )
}
