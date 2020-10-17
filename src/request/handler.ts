export async function handleRequest(request: Request): Promise<Response> {
  console.log(request)

  return new Response(`request method: ${request.method}`)
  switch (request.method) {
   case 'GET': return new Response('GET')
   case 'POST': request.arrayBuffer().then(d => console.log(d)) return new Response('POST')
  }
  return new Response(null, 500)
}
