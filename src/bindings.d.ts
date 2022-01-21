export {}

namespace WebAssembly {
  interface Memory {
    constructor(opts: any)
  }
  interface Instance {
    constructor(wasm: any, opts: any)
  }
}

declare global {
  const BOOTSTRAP: KVNamespace
  const WebAssembly: WebAssembly
}
