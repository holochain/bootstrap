import bootstrapWasm from './holochain_bootstrap_wasm_bg.js'
import workerIndex from './worker.js'

export default {
  fetch: async (request, env) => {
    return await workerIndex.fetch(request, env, bootstrapWasm)
  }
}
