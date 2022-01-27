use super::*;

/// Response type for the KV "list" call
#[derive(Debug)]
pub struct KVListResp {
    /// The keys returned by "list"
    pub keys: Vec<String>,

    /// If the results are paginated, the opaque cursor
    pub cursor: String,

    /// "true" if this is the entire list, "false" if paginated
    pub list_complete: bool,
}

/// Wrapper for cloudflare KV object
pub struct KV(pub JsValue);

impl KV {
    /// Internal helper for getting a specific function from the KV object
    fn get_func_prop(&self, name: &str) -> JsResult<js_sys::Function> {
        let func: JsValue = js_sys::Reflect::get(&self.0, &name.into())?;
        if !func.is_function() {
            return Err(format!("{} is not a function", name).into());
        }
        Ok(func.into())
    }

    /// Put data into the KV store
    pub fn put(
        &self,
        key: &str,
        value: &[u8],
        ttl: f64,
    ) -> JsResult<impl Future<Output = JsResult<()>>> {
        let func = self.get_func_prop("put")?;

        let key: JsValue = key.into();
        let value: JsValue = js_sys::Uint8Array::from(value).into();

        let expiration_ttl: JsValue = Some(ttl).into();

        let opts = js_sys::Object::new();
        js_sys::Reflect::set(&opts, &"expirationTtl".into(), &expiration_ttl)?;

        let res = func.call3(&self.0, &key, &value, &opts)?;

        let res: js_sys::Promise = res.into();

        Ok(async move {
            wasm_bindgen_futures::JsFuture::from(res).await?;
            Ok(())
        })
    }

    /// Get an item from the KV store
    pub fn get(&self, key: &str) -> JsResult<impl Future<Output = JsResult<Box<[u8]>>>> {
        let func = self.get_func_prop("get")?;

        let key: JsValue = key.into();
        let type_: JsValue = "arrayBuffer".into();

        let res = func.call2(&self.0, &key, &type_)?;

        let res: js_sys::Promise = res.into();

        Ok(async move {
            let res = wasm_bindgen_futures::JsFuture::from(res).await?;
            if !res.is_instance_of::<js_sys::ArrayBuffer>() {
                return Err("result must be an ArrayBuffer".into());
            }
            let res = js_sys::Uint8Array::new(&res);
            Ok(res.to_vec().into_boxed_slice())
        })
    }

    /// List keys from the KV store
    pub fn list(
        &self,
        limit: Option<f64>,
        prefix: Option<String>,
        cursor: Option<String>,
    ) -> JsResult<impl Future<Output = JsResult<KVListResp>>> {
        let func = self.get_func_prop("list")?;

        let limit: JsValue = limit.into();
        let prefix: JsValue = prefix.into();
        let cursor: JsValue = cursor.into();

        let opts = js_sys::Object::new();
        js_sys::Reflect::set(&opts, &"limit".into(), &limit)?;
        js_sys::Reflect::set(&opts, &"prefix".into(), &prefix)?;
        js_sys::Reflect::set(&opts, &"cursor".into(), &cursor)?;

        let res = func.call1(&self.0, &opts)?;

        let res: js_sys::Promise = res.into();

        Ok(async move {
            let res = wasm_bindgen_futures::JsFuture::from(res).await?;

            let list_complete = js_sys::Reflect::get(&res, &"list_complete".into())?
                .as_bool()
                .ok_or_else(|| JsValue::from("list_complete must be a boolean"))?;
            let cursor = js_sys::Reflect::get(&res, &"cursor".into())?
                .as_string()
                .ok_or_else(|| JsValue::from("cursor must be a string"))?;
            let js_keys = js_sys::Reflect::get(&res, &"keys".into())?;
            if !js_keys.is_instance_of::<js_sys::Array>() {
                return Err("keys must be an array".into());
            }
            let js_keys: js_sys::Array = js_keys.into();

            let mut keys = Vec::with_capacity(js_keys.length() as usize);
            for key in js_keys.values() {
                let name = js_sys::Reflect::get(&key?, &"name".into())?
                    .as_string()
                    .ok_or_else(|| JsValue::from("key.name must be a string"))?;
                keys.push(name);
            }

            Ok(KVListResp {
                keys,
                cursor,
                list_complete,
            })
        })
    }
}
