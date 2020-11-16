import * as D from 'io-ts/Decoder'
import * as MP from '../msgpack/msgpack'
import { pipe } from 'fp-ts/lib/pipeable'
import * as E from 'fp-ts/lib/Either'
import * as KVRandom from '../kv/random'

// Returns random agents according to the input query.
// Returns any errors, or a messagepack array of signed agent info data.
// @see random as documented under kv.
export async function random(input:MP.MessagePackData):MP.MessagePackData|Error {
 try {
  let result = await pipe(
   KVRandom.QuerySafe.decode(input),
   E.chain(async queryValue => D.success(MP.encode(await KVRandom.random(queryValue)))),
   E.mapLeft(v => Error(JSON.stringify(v))),
  )
  if (E.isLeft(result)) {
   return result.left
  }
  else {
   return result.right
  }
 }
 catch (e) {
  return e
 }
}
