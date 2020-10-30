import { postHandler } from './post'

export async function eventDispatch(event:Event):Promise<Response> {
 if (event.request.method === 'POST') {
  return postHandler(event)
 }

 // Respond with a simple pong for any GET to help with smoke testing.
 if (event.request.method === 'GET') {
  return new Response('OK')
 }

 return new Response('unhandled request', { status: 500 })
}
