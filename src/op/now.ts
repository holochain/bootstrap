import * as MP from '../msgpack/msgpack'

// The `now` op does not interact with the kv store at all.
// We can encompass all the logic as a native call, messagepack encoded.
// There is no threshold here, unlike in put, because this endpoint is intended
// for agents to sync against, not to write or have data verified against.
export const now = async (_:MP.MessagePackData):MP.MessagePackData|Error => {
 try {
  return MP.encode(Date.now())
 }
 catch (e) {
  return e
 }
}
