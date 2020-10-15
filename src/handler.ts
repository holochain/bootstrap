export async function handleRequest(request: Request): Promise<Response> {
  console.log(request)
  return new Response(`request method: ${request.method}`)
}
