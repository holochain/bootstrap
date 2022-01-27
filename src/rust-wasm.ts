// @ts-ignore
import * as bootstrap_wasm_bg from '../../rust/target/wasm-build/holochain_bootstrap_wasm_bg.js'

interface BootstrapWasm {
  handle_request: (
    kv: KVNamespace,
    method: string,
    op: string,
    input: Uint8Array,
  ) => Promise<{
    status: number
    headers: Array<[string, string]>
    body: Uint8Array
  }>
}

// @ts-ignore
const bootstrap_wasm: BootstrapWasm = bootstrap_wasm_bg.default

export default bootstrap_wasm
