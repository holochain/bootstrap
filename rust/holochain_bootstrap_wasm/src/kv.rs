use super::*;

use alloc::boxed::Box;
use alloc::string::String;
use alloc::vec::Vec;

/// Js-2-Rust KV ffi bindings
pub struct KV(JsValue);

impl KV {
    pub fn new(kv: JsValue) -> JsResult<Self> {
        Ok(KV(kv))
    }

    // -- private -- //

    /// Internal helper for getting a specific function from the KV object
    fn get_func_prop(&self, name: &str) -> BCoreResult<js_sys::Function> {
        let func: JsValue =
            js_sys::Reflect::get(&self.0, &name.into()).map_err(|e| bcore_err!("{:?}", e))?;
        if !func.is_function() {
            return Err(format!("{} is not a function", name).into());
        }
        Ok(func.into())
    }
}

impl AsKV for KV {
    fn put<'a>(&'a self, key: &str, value: &[u8], ttl_secs: f64) -> BCoreFut<'a, BCoreResult<()>> {
        let key: JsValue = key.into();
        let value: JsValue = js_sys::Uint8Array::from(value).into();

        bcore_fut(async move {
            let func = self.get_func_prop("put")?;

            let expiration_ttl: JsValue = Some(ttl_secs).into();

            let opts = js_sys::Object::new();
            js_sys::Reflect::set(&opts, &"expirationTtl".into(), &expiration_ttl)
                .map_err(|e| bcore_err!("{:?}", e))?;

            let res = func
                .call3(&self.0, &key, &value, &opts)
                .map_err(|e| bcore_err!("{:?}", e))?;

            let res: js_sys::Promise = res.into();
            wasm_bindgen_futures::JsFuture::from(res)
                .await
                .map_err(|e| bcore_err!("{:?}", e))?;

            Ok(())
        })
    }

    fn get<'a>(&'a self, key: &str) -> BCoreFut<'a, BCoreResult<Box<[u8]>>> {
        let key: JsValue = key.into();

        bcore_fut(async move {
            let func = self.get_func_prop("get")?;

            let type_: JsValue = "arrayBuffer".into();

            let res = func
                .call2(&self.0, &key, &type_)
                .map_err(|e| bcore_err!("{:?}", e))?;

            let res: js_sys::Promise = res.into();
            let res = wasm_bindgen_futures::JsFuture::from(res)
                .await
                .map_err(|e| bcore_err!("{:?}", e))?;

            if !res.is_instance_of::<js_sys::ArrayBuffer>() {
                return Err("result must be an ArrayBuffer".into());
            }

            let res = js_sys::Uint8Array::new(&res);

            Ok(res.to_vec().into_boxed_slice())
        })
    }

    fn delete<'a>(&'a self, _key: &str) -> BCoreFut<'a, BCoreResult<()>> {
        bcore_fut(async move { Err("unimplemented".into()) })
    }

    fn list_progressive<'a, 'b: 'a>(
        &'a self,
        prefix: Option<&str>,
        mut cb: Box<dyn FnMut(&mut Vec<String>) -> BCoreResult<()> + 'b>,
    ) -> BCoreFut<'a, BCoreResult<()>> {
        let prefix: Option<JsValue> = prefix.map(|p| p.into());
        bcore_fut(async move {
            let func = self.get_func_prop("list")?;
            let mut cursor: Option<JsValue> = None;
            let mut out = Vec::new();

            loop {
                let opts = js_sys::Object::new();
                if let Some(prefix) = &prefix {
                    js_sys::Reflect::set(&opts, &"prefix".into(), prefix)
                        .map_err(|e| bcore_err!("{:?}", e))?;
                }
                if let Some(cursor) = &cursor {
                    js_sys::Reflect::set(&opts, &"cursor".into(), cursor)
                        .map_err(|e| bcore_err!("{:?}", e))?;
                }

                let res = func
                    .call1(&self.0, &opts)
                    .map_err(|e| bcore_err!("{:?}", e))?;
                let res: js_sys::Promise = res.into();
                let res = wasm_bindgen_futures::JsFuture::from(res)
                    .await
                    .map_err(|e| bcore_err!("{:?}", e))?;

                let js_keys = js_sys::Reflect::get(&res, &"keys".into())
                    .map_err(|e| bcore_err!("{:?}", e))?;
                if !js_keys.is_instance_of::<js_sys::Array>() {
                    return Err("keys must be an array".into());
                }
                let js_keys: js_sys::Array = js_keys.into();
                for key in js_keys.values() {
                    let key = key.map_err(|e| bcore_err!("{:?}", e))?;
                    let name = js_sys::Reflect::get(&key, &"name".into())
                        .map_err(|e| bcore_err!("{:?}", e))?
                        .as_string()
                        .ok_or_else(|| BCoreError::from("key.name must be a string"))?;
                    out.push(name);
                }

                cb(&mut out)?;
                out.clear();

                let list_complete = js_sys::Reflect::get(&res, &"list_complete".into())
                    .map_err(|e| bcore_err!("{:?}", e))?
                    .as_bool()
                    .ok_or_else(|| BCoreError::from("list_complete must be a boolean"))?;

                if list_complete {
                    break;
                }

                let c = js_sys::Reflect::get(&res, &"cursor".into())
                    .map_err(|e| bcore_err!("{:?}", e))?;
                cursor = Some(c)
            }

            Ok(())
        })
    }
}
