import * as D from 'io-ts/Decoder'
import * as MP from '../msgpack/msgpack'
import { pipe } from 'fp-ts/lib/pipeable'
import * as E from 'fp-ts/lib/Either'
import * as KVRandom from '../kv/random'

export async function random(input:MP.MessagePackData):MP.MessagePackData|Error {
 let result = await pipe(
  KVRandom.querySafe.decode(input),
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
