use crate::types::*;

const OP_TRIGGER_SCHEDULED: &str = "trigger_scheduled";

/// Handler for method: "POST", op: "trigger_scheduled".
/// Manually trigger the "scheduled" cron event
pub struct PostTriggerScheduled;

impl AsRequestHandler for PostTriggerScheduled {
    fn handles_method(&self) -> &'static str {
        super::METHOD_POST
    }

    fn handles_op(&self) -> &'static str {
        OP_TRIGGER_SCHEDULED
    }

    fn handle<'a>(
        &'a self,
        kv: &'a dyn AsKV,
        host: &'a dyn AsFromHost,
        input: &'a [u8],
    ) -> BCoreFut<'a, BCoreResult<HttpResponse>> {
        bcore_fut(async move {
            if !input.is_empty() {
                return Err("body must be empty for 'POST/trigger_scheduled'".into());
            }

            crate::exec_scheduled(kv, host).await?;

            Ok(HttpResponse {
                status: 200,
                headers: vec![("content-type".into(), "text/plain".into())],
                body: b"Ok".to_vec(),
            })
        })
    }
}