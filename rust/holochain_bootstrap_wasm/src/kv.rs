use super::*;

/// Js-2-Rust KV ffi bindings
pub struct KV;

impl KV {
    pub fn new(_kv: JsValue) -> JsResult<Self> {
        Ok(KV)
    }
}

impl AsKV for KV {
    fn put<'a>(
        &'a self,
        _key: &str,
        _value: &[u8],
        _ttl_secs: f64,
    ) -> BCoreFut<'a, BCoreResult<()>> {
        bcore_fut(async move { Err("unimplemented".into()) })
    }

    fn get<'a>(&'a self, _key: &str) -> BCoreFut<'a, BCoreResult<Box<[u8]>>> {
        bcore_fut(async move { Err("unimplemented".into()) })
    }

    fn delete<'a>(&'a self, _key: &str) -> BCoreFut<'a, BCoreResult<()>> {
        bcore_fut(async move { Err("unimplemented".into()) })
    }

    fn list<'a>(&self, _prefix: Option<&str>) -> BCoreFut<'a, BCoreResult<Vec<String>>> {
        bcore_fut(async move { Err("unimplemented".into()) })
    }
}
