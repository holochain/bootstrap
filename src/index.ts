import { Ctx } from './ctx'
import { requestDispatch } from './request/dispatch'

export default {
  async fetch(
    request: Request,
    env: { BOOTSTRAP: KVNamespace },
  ): Promise<Response> {
    const ctx = new Ctx(request, env.BOOTSTRAP)
    return await requestDispatch(ctx)
  },
}
