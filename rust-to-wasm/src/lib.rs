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

/// Handle an incoming request building up a response
#[wasm_bindgen]
pub async fn handle_request(
    kv: JsValue,
    method: JsValue,
    op: JsValue,
    input: JsValue,
) -> JsResult<JsValue> {
    let kv = KV(kv);
    struct DKV(KV);

    use holochain_bootstrap_core::*;

    impl AsKV for DKV {
        fn put<'a>(&'a self, key: &'a str, value: &'a [u8]) -> BoxFut<'a, BcResult<()>> {
            let res = self.0.put(key, value, 60.0);
            boxfut(async move {
                res
                    .map_err(|e| fmt_err!("{:?}", e))?
                    .await
                    .map_err(|e| fmt_err!("{:?}", e))
            })
        }
    }

    let kv = DKV(kv);

    let mut dispatcher = HandlerDispatcher::new(kv);
    dispatcher.attach_handler(handlers::PostPut);

    let dispatcher = std::sync::Arc::new(dispatcher);

    let method = method.as_string().ok_or(JsValue::from("method must be a string"))?;
    let op = op.as_string().ok_or(JsValue::from("op must be a string"))?;
    if !input.is_instance_of::<js_sys::Uint8Array>() {
        return Err("input must be a Uint8Array".into());
    }
    let input = js_sys::Uint8Array::from(input).to_vec();

    dispatcher
        .handle(&method, &op, &input).await
        .map_err(|e| format!("{:?}", e).into())
        .map(|r| format!("{:?}", r).into())
}
