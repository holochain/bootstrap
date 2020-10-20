import { postHandler } from './post'

export async function eventDispatch(event:Event):Promise<Response> {
 if (event.request.method === 'POST') {
  return postHandler(event)
 }

 return new Response('unhandled request', { status: 500 })
}
