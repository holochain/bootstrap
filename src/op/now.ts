import { Ctx } from '../ctx'
import * as MP from '../msgpack/msgpack'

// The `now` op does not interact with the kv store at all.
// We can encompass all the logic as a native call, messagepack encoded.
export const now = async (
  _: MP.MessagePackData,
  _ctx: Ctx,
): Promise<MP.MessagePackData | Error> => {
  try {
    return MP.encode(Date.now())
  } catch (e) {
    if (e instanceof Error) {
      return e
    } else {
      return new Error(JSON.stringify(e))
    }
  }
}
