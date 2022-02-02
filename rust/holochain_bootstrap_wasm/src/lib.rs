#![allow(clippy::unused_unit)] // doesn't pick up #[wasm_bindgen]...
#![deny(unsafe_code)]
#![deny(missing_docs)]
#![deny(warnings)]
//! Holochain Bootstrap Code Cloudflare Typescript / Rust Wasm FFI Bindings

use wasm_bindgen::prelude::*;

/// Generic Javascript Result Type
pub type JsResult<T> = std::result::Result<T, JsValue>;

/// Handle an incoming request building up a response
#[wasm_bindgen]
pub async fn handle_request(
    _kv: JsValue,
    _method: JsValue,
    _op: JsValue,
    _input: JsValue,
) -> JsResult<JsValue> {
    let _stub = holochain_bootstrap_core::HandlerDispatcher {};

    Err("stub".into())
}
