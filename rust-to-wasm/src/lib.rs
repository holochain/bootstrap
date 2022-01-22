#![deny(unsafe_code)]
#![deny(missing_docs)]
#![deny(warnings)]
//! Holochain Bootstrap Code Cloudflare Typescript / Rust Wasm FFI Bindings

use wasm_bindgen::prelude::*;
use std::future::Future;

use wasm_bindgen::JsCast;
use std::iter::FromIterator;

/// Generic Javascript Result Type
pub type JsResult<T> = std::result::Result<T, JsValue>;

mod kv;
pub use kv::*;

/// List the active proxy servers stored in cloudflare BOOTSTRAP KV store
#[wasm_bindgen]
pub async fn proxy_list(kv: JsValue) -> JsResult<JsValue> {
    let kv = KV(kv);
    kv.put("active_proxy:test-entry", b"my-proxy-url:0.0.0.0:0/hurray", 60.0)?.await?;
    let res = kv.list(None, Some("active_proxy:".to_string()), None)?.await?;

    let mut output = Vec::with_capacity(res.keys.len());

    for key in &res.keys {
        output.push(JsValue::from(String::from_utf8_lossy(&kv.get(key)?.await?).to_string()));
    }

    let output = js_sys::Array::from_iter(output.into_iter());

    Ok(output.into())
}
