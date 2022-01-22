// @ts-ignore
import * as rust_to_wasm_bg from '../../rust-to-wasm/build/rust_to_wasm_bg.js'

interface RustToWasm {
  proxy_list: (kv: KVNamespace) => Promise<Array<string>>
}

// @ts-ignore
const rust_to_wasm: RustToWasm = rust_to_wasm_bg.default

export default rust_to_wasm
