use crate::types::*;

/// Handler for method: "POST", op: "proxy_list".
/// List all entries in the kv with a prefix of "proxy_pool:".
pub struct PostProxyList;

impl AsRequestHandler for PostProxyList {
    fn handles_method(&self) -> &'static str {
        "POST"
    }

    fn handles_op(&self) -> &'static str {
        "proxy_list"
    }

    fn handle<'a>(
        &'a self,
        kv: &'a dyn AsKV,
        input: &'a [u8],
    ) -> BCoreFut<'a, BCoreResult<HttpResponse>> {
        bcore_fut(async move {
            if !input.is_empty() {
                return Err("body must be empty for 'POST/proxy_list'".into());
            }

            let entries = kv.list(Some("proxy_pool:")).await?;

            let mut enc = msgpackin_core::encode::Encoder::new();
            let mut body = alloc::vec::Vec::new();

            body.extend_from_slice(&enc.enc_arr_len(entries.len() as u32));

            for key in entries {
                let key = key.into_bytes();
                let key = &key[11..];
                body.extend_from_slice(&enc.enc_str_len(key.len() as u32));
                body.extend_from_slice(key);
            }

            Ok(HttpResponse {
                status: 200,
                headers: vec![("content-type".into(), "application/octet-stream".into())],
                body,
            })
        })
    }
}
