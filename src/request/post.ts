import { AgentInfo } from '../agent_info/info'
import { putAgentInfoSigned, listSpace, getAgentInfoSigned } from '../kv/kv'

const DISPATCH_HEADER: string = 'X-Op'
const OP_PUT: string = 'put'
const OP_LIST: string = 'list'
const OP_GET: string = 'get'

async function handle(f:(bytes:Uint8Array)=> MessagePackData|Error , bytes:Uint8Array):Promise<Response> {
 let tryIt = await f(bytes)

 if (tryIt instanceof Error) {
  return new Response(tryIt, { status: 500 })
 }

 return new Response(tryIt)
}

export async function postHandler(event:Event):Promise<Response> {
 let bodyBytes = new Uint8Array(await event.request.arrayBuffer())

 switch(event.request.headers.get(DISPATCH_HEADER)) {
  case OP_PUT: return handle(putAgentInfoSigned, bodyBytes)
  case OP_LIST: return handle(listSpace, bodyBytes)
  case OP_GET: return handle(getAgentInfoSigned, bodyBytes)
  default: return new Response(encode('unknown op'), { status: 500 })
 }
}
