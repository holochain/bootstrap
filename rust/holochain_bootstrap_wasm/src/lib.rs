#![allow(clippy::unused_unit)] // doesn't pick up #[wasm_bindgen]...
#![deny(unsafe_code)]
#![deny(missing_docs)]
#![deny(warnings)]
//! Holochain Bootstrap Code Cloudflare Typescript / Rust Wasm FFI Bindings

use holochain_bootstrap_core::types::*;
use holochain_bootstrap_core::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

/// Generic Javascript Result Type
pub type JsResult<T> = std::result::Result<T, JsValue>;

mod kv;
use kv::*;

/// Handle an incoming request building up a response
#[wasm_bindgen]
pub async fn handle_request(
    kv: JsValue,
    method: JsValue,
    op: JsValue,
    input: JsValue,
) -> JsResult<JsValue> {
    let kv = KV::new(kv)?;
    let mut dispatch = HandlerDispatcher::new(kv);
    dispatch.attach_handler(handlers::PostPut);

    let method = method
        .as_string()
        .ok_or_else(|| JsValue::from(format!("expect method as string: {:?}", method)))?;
    let op = op
        .as_string()
        .ok_or_else(|| JsValue::from(format!("expect op as string: {:?}", op)))?;
    if !input.is_instance_of::<js_sys::Uint8Array>() {
        return Err("input must be a Uint8Array".into());
    }
    let input = js_sys::Uint8Array::from(input).to_vec();

    match dispatch.handle(&method, &op, &input).await {
        Ok(res) => Err(format!("stub handler would have: {:?}", res).into()),
        Err(err) => Err(format!("{:?}", err).into()),
    }
}
