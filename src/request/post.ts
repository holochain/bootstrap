import { AgentInfo } from '../agent_info/info'
import { putAgentInfoSigned, listSpace } from '../kv/kv'

const DISPATCH_HEADER: string = 'X-Op'
const OP_PUT: string = 'put'
const OP_LIST: string = 'list'

export async function putHandler(bytes:Uint8Array):Promise<Response> {
 let tryPut = await putAgentInfoSigned(bytes)

 if (tryPut instanceof Error) {
  return new Response(tryPut, { status: 500 })
 }

 return new Response('OK')
}

export async function listHandler(bytes:Uint8Array):Promise<Response> {
 let tryList = await listSpace(bytes)

 if (tryList instanceof Error) {
  return new Response(tryList, { status: 500 })
 }

 return new Response(tryList)
}

export async function postHandler(event:Event):Promise<Response> {
 let bodyBytes = new Uint8Array(await event.request.arrayBuffer())

 switch(event.request.headers.get(DISPATCH_HEADER)) {
  case OP_PUT: return putHandler(bodyBytes)
  case OP_LIST: return listHandler(bodyBytes)
  default: return new Response('unknown op', { status: 500 })
 }
}
