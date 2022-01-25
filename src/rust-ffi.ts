// @ts-ignore
import * as rust_to_wasm_bg from '../../rust-to-wasm/build/rust_to_wasm_bg.js'

interface RustToWasm {
  proxy_list: (kv: KVNamespace) => Promise<Array<string>>
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
const rust_to_wasm: RustToWasm = rust_to_wasm_bg.default

export default rust_to_wasm
