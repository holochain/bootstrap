use crate::metrics::*;
use crate::types::*;

const OP_METRICS: &str = "metrics";

/// Handler for method: "GET", op: "metrics".
pub struct GetMetrics;

impl AsRequestHandler for GetMetrics {
    fn handles_method(&self) -> &'static str {
        super::METHOD_GET
    }

    fn handles_op(&self) -> &'static str {
        OP_METRICS
    }

    fn handle<'a>(
        &'a self,
        kv: &'a dyn AsKV,
        _host: &'a dyn AsFromHost,
        input: &'a [u8],
    ) -> BCoreFut<'a, BCoreResult<HttpResponse>> {
        bcore_fut(async move {
            if !input.is_empty() {
                return Err("body must be empty for 'GET/metrics'".into());
            }

            let mut body = alloc::vec::Vec::new();
            body.extend_from_slice(
                br#"{
  "header": ["timestamp", "total_agent_count", "total_space_count", "total_proxy_count"],
  "data": ["#,
            );

            let entries = kv.list(Some(METRIC_PREFIX)).await?;
            let mut first = true;
            for key in entries {
                let val = kv.get(&key).await?;
                let val = Metrics::decode(&val);
                if first {
                    first = false;
                    body.extend_from_slice(b"\n    [");
                } else {
                    body.extend_from_slice(b",\n    [");
                }
                body.extend_from_slice(&key.as_bytes()[METRIC_PREFIX.len()..]);
                body.extend_from_slice(
                    &format!(
                        ", {}, {}, {}]",
                        val.total_agent_count, val.total_space_count, val.total_proxy_count,
                    )
                    .into_bytes(),
                );
            }

            body.extend_from_slice(b"\n  ]\n}\n");

            Ok(HttpResponse {
                status: 200,
                headers: vec![("content-type".into(), "application/json".into())],
                body,
            })
        })
    }
}
