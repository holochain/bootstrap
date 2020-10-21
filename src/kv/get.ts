import { MessagePackData } from '../msgpack/msgpack'
import { key, Key, agentKey } from './kv'
import { spaceLength } from '../kitsune/kitsune'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'

export async function _get(key:Key):MessagePackData|Error {
 let space = key.slice(0,spaceLength)
 let agent = key.slice(spaceLength)

 return await BOOTSTRAP.get(agentKey(space, agent), 'arrayBuffer')
}

export async function get(input:MessagePackData):MessagePackData|Error {
 return pipe(
  key.decode(input),
  E.fold(
   errors => Error(JSON.stringify(errors)),
   // Values are already messagepack data so return as is.
   async keyValue => await _get(keyValue),
  )
 )
}
