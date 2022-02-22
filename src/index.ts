import { BootstrapWasm, Ctx } from './ctx'
import { requestDispatch } from './request/dispatch'

export default {
  async fetch(
    request: Request,
    env: { BOOTSTRAP: KVNamespace },
    bootstrapWasm: BootstrapWasm,
  ): Promise<Response> {
    const ctx = new Ctx(request, env.BOOTSTRAP, bootstrapWasm)
    return await requestDispatch(ctx)
  },

  async scheduled(
    env: { BOOTSTRAP: KVNamespace },
    bootstrapWasm: BootstrapWasm,
  ): Promise<void> {
    await bootstrapWasm.handle_scheduled(env.BOOTSTRAP)
  },
}
