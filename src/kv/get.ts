import * as MP from '../msgpack/msgpack'
import { key, Key, agentKey } from '../kv/kv'
import * as Kitsune from '../kitsune/kitsune'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import { Uint8ArrayDecoder } from '../io/io'
import * as D from 'io-ts/Decoder'

// Get a single signed agent info by its space+agent key in the kv store.
// Returns:
// - The signed agent info data, as signed by the agent, as messagepack data OR
// - null encoded as messagepack if the key does not exist OR
// - an error if there is some error
export async function get(key:Key):MP.MessagePackData|Error {
 try {
  let space = key.slice(0,Kitsune.spaceLength)
  let agent = key.slice(Kitsune.spaceLength)
  let value = await BOOTSTRAP.get(agentKey(space, agent), 'arrayBuffer')
  // Found values are already messagepack encoded but null won't be so we have to
  // manually encode it here.
  return ( value === null ) ? MP.encode(null) : new Uint8Array(value)
 }
 catch (e) {
  return e
 }
}
