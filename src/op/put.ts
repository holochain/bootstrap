import * as MP from '../msgpack/msgpack'
import * as E from 'fp-ts/lib/Either'
import * as KVPut from '../kv/put'

export async function put(input:MP.MessagePackData):MP.MessagePackData|Error {
 // put literally puts the raw MessagePackData to the kv store if it validates.
 // the key is derived from the raw data.
 let p = await KVPut.put(input)
 if (E.isLeft(p)) {
  return p.left
 }
 else {
  return MP.encode(p.right)
 }
}
