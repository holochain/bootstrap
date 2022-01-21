// @ts-ignore
import * as rust_to_wasm_bg from '../../rust-to-wasm/build/rust_to_wasm_bg.js'

interface RustToWasm {
  wasm_test_fn: (input: string) => string
}

// @ts-ignore
const rust_to_wasm: RustToWasm = rust_to_wasm_bg.default

export default rust_to_wasm
