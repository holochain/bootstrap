use super::*;

pub struct Host(JsValue);

impl Host {
    pub fn new(host: JsValue) -> JsResult<Self> {
        Ok(Host(host))
    }

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

impl AsFromHost for Host {
    fn get_timestamp_millis(&self) -> BCoreResult<i64> {
        let func = self.get_func_prop("get_timestamp_millis")?;
        let res = func.call0(&self.0).map_err(|e| bcore_err!("{:?}", e))?;
        let res = res
            .as_f64()
            .ok_or_else(|| BCoreError::from("expected num"))?;
        Ok(res as i64)
    }
}
