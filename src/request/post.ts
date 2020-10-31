import { put } from '../kv/put'
import { list } from '../kv/list'
import { get } from '../kv/get'
import { random } from '../kv/random'
import { strict as assert } from 'assert'
import * as MP from '../msgpack/msgpack'

const DISPATCH_HEADER: string = 'X-Op'
const OP_PUT: string = 'put'
const OP_LIST: string = 'list'
const OP_GET: string = 'get'
const OP_RANDOM: string = 'random'

async function handle(f:(bytes:Uint8Array)=> MP.MessagePackData|Error, input:MP.MessagePackData):Promise<Response> {
 // Every f needs to handle messagepack decoding itself so that the deserialized
 // object can sanity check itself.
 let tryF = await f(input)

 if (tryF instanceof Error) {
  return new Response(MP.encode('' + tryF), { status: 500 })
 }

 return new Response(tryF)
}

export async function postHandler(event:Event):Promise<Response> {
 let input = new Uint8Array(await event.request.arrayBuffer())
 switch(event.request.headers.get(DISPATCH_HEADER)) {
  case OP_PUT: return handle(put, input)
  case OP_LIST: return handle(list, input)
  case OP_GET: return handle(get, input)
  case OP_RANDOM: return handle(random, input)
  default: return new Response(MP.encode('unknown op'), { status: 500 })
 }
 assert.unreachable('broken dispatch switch')
}
