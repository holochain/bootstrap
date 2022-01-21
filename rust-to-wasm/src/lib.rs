use wasm_bindgen::prelude::*;

pub type Result = std::result::Result<JsValue, JsValue>;

#[wasm_bindgen]
pub fn wasm_test_fn(input: JsValue) -> Result {
    Ok(format!("got: {:?}", input).into())
}

/*
#[wasm_bindgen]
pub async fn proxy_list(hooks: JsValue) -> Result {
    let this = JsValue::null();
    let limit: JsValue = <Option<f64>>::None.into();
    let prefix: JsValue = Some("active_proxy:".to_string()).into();
    let cursor: JsValue = <Option<String>>::None.into();
    let func: js_sys::Function = js_sys::Reflect::get(&hooks, &"kv_list".into())?.into();
    let res = func.call3(&this, &limit, &prefix, &cursor)?;
    let res: js_sys::Promise = res.into();
    let res = wasm_bindgen_futures::JsFuture::from(res).await?;
    Ok(res)
}
*/
