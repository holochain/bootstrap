#![no_std]
#![allow(clippy::unused_unit)] // doesn't pick up #[wasm_bindgen]...
#![deny(unsafe_code)]
#![deny(missing_docs)]
#![deny(warnings)]
//! Holochain Bootstrap Code Cloudflare Typescript / Rust Wasm FFI Bindings

#[macro_use]
extern crate alloc;

use holochain_bootstrap_core::types::*;
use holochain_bootstrap_core::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

/// Generic Javascript Result Type
pub type JsResult<T> = core::result::Result<T, JsValue>;

mod kv;
use kv::*;

mod host;
use host::*;

/// Handle a scheduled event
#[wasm_bindgen]
pub async fn handle_scheduled(kv: JsValue, host: JsValue) -> JsResult<()> {
    let kv = KV::new(kv)?;
    let host = Host::new(host)?;
    exec_scheduled(&kv, &host, false)
        .await
        .map_err(|e| format!("{e:?}").into())
        .map(|_| ())
}

/// Handle an incoming request building up a response
#[wasm_bindgen]
pub async fn handle_request(
    kv: JsValue,
    host: JsValue,
    method: JsValue,
    op: JsValue,
    input: JsValue,
) -> JsResult<JsValue> {
    let kv = KV::new(kv)?;
    let host = Host::new(host)?;
    let mut dispatch = HandlerDispatcher::new(kv, host);
    dispatch.attach_handler(handlers::GetMetrics);
    dispatch.attach_handler(handlers::PostPut);
    dispatch.attach_handler(handlers::PostProxyList);
    dispatch.attach_handler(handlers::PostTriggerScheduled);
    dispatch.attach_handler(handlers::PostTriggerScheduledForce);

    let method = method
        .as_string()
        .ok_or_else(|| JsValue::from(format!("expect method as string: {method:?}")))?;
    let op = op
        .as_string()
        .ok_or_else(|| JsValue::from(format!("expect op as string: {op:?}")))?;
    if !input.is_instance_of::<js_sys::Uint8Array>() {
        return Err("input must be a Uint8Array".into());
    }
    let input = js_sys::Uint8Array::from(input).to_vec();

    match dispatch.handle(&method, &op, &input).await {
        Ok(res) => {
            let out = js_sys::Object::new();
            let status = res.status.into();
            js_sys::Reflect::set(&out, &"status".into(), &status)?;
            let headers = js_sys::Array::new_with_length(res.headers.len() as u32);
            for (i, (key, val)) in res.headers.iter().enumerate() {
                let item = js_sys::Array::new_with_length(2);
                item.set(0, key.into());
                item.set(1, val.into());
                headers.set(i as u32, item.into());
            }
            let headers = headers.into();
            js_sys::Reflect::set(&out, &"headers".into(), &headers)?;
            let body = js_sys::Uint8Array::from(res.body.as_slice()).into();
            js_sys::Reflect::set(&out, &"body".into(), &body)?;
            Ok(out.into())
        }
        Err(err) => Err(format!("{err:?}").into()),
    }
}
