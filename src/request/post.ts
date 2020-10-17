import { AgentInfo } from '../agent_info/info'

async function postHandler(event:Event):Promise<Response> {
 let bodyBytes = await event.request.arrayBuffer()
 let base64 = Buffer.from(new Uint8Array(bodyBytes)).toString('base64')

 let agent_info = AgentInfo.unpack(bodyBytes)

 return new Response(base64)
}
