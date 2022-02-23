use crate::types::*;

const OP_PROXY_LIST: &str = "proxy_list";

/// Handler for method: "POST", op: "proxy_list".
/// List all entries in the kv with a prefix of "proxy_pool:".
pub struct PostProxyList;

impl AsRequestHandler for PostProxyList {
    fn handles_method(&self) -> &'static str {
        super::METHOD_POST
    }

    fn handles_op(&self) -> &'static str {
        OP_PROXY_LIST
    }

    fn handle<'a>(
        &'a self,
        kv: &'a dyn AsKV,
        _host: &'a dyn AsFromHost,
        input: &'a [u8],
    ) -> BCoreFut<'a, BCoreResult<HttpResponse>> {
        bcore_fut(async move {
            if !input.is_empty() {
                return Err("body must be empty for 'POST/proxy_list'".into());
            }

            let entries = kv.list(Some(crate::PROXY_PREFIX)).await?;

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
