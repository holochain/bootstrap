import { put } from '../op/put'
import { list } from '../op/list'
import { get } from '../op/get'
import { random } from '../op/random'
import { now } from '../op/now'
import { strict as assert } from 'assert'
import * as MP from '../msgpack/msgpack'

const DISPATCH_HEADER: string = 'X-Op'
const OP_PUT: string = 'put'
const OP_RANDOM: string = 'random'
const OP_NOW: string = 'now'

async function handle(f:(bytes:Uint8Array)=> MP.MessagePackData|Error, input:MP.MessagePackData):Promise<Response> {
 // Every f needs to handle messagepack decoding itself so that the deserialized
 // object can sanity check itself.
 let tryF = await f(input)

 if (tryF instanceof Error) {
  console.error('messagepack input:', input.toString('base64'))
  console.error('error:', '' + tryF)
  return new Response('' + tryF, { status: 500 })
 }

 return new Response(tryF)
}

export async function postHandler(event:Event):Promise<Response> {
 let input = new Uint8Array(await event.request.arrayBuffer())
 switch(event.request.headers.get(DISPATCH_HEADER)) {
  case OP_PUT: return handle(put, input)
  case OP_RANDOM: return handle(random, input)
  case OP_NOW: return handle(now, input)
  default: return new Response(MP.encode('unknown op'), { status: 500 })
 }
 assert.unreachable('broken dispatch switch')
}
