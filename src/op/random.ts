import * as D from 'io-ts/Decoder'
import * as MP from '../msgpack/msgpack'
import { pipe } from 'fp-ts/lib/pipeable'
import * as E from 'fp-ts/lib/Either'
import * as KVRandom from '../kv/random'

// Returns random agents according to the input query.
// Returns any errors, or a messagepack array of signed agent info data.
// @see random as documented under kv.
export async function random(
  input: MP.MessagePackData,
): Promise<MP.MessagePackData | Error> {
  try {
    let result = await pipe(
      KVRandom.QuerySafe.decode(input),
      E.mapLeft((v) => Error(JSON.stringify(v))),
      E.map(async (queryValue) => {
        return MP.encode(await KVRandom.random(queryValue))
      }),
    )
    if (E.isLeft(result)) {
      return result.left
    } else {
      return await result.right
    }
  } catch (e) {
    if (e instanceof Error) {
      return e
    } else {
      return new Error(JSON.stringify(e))
    }
  }
}
