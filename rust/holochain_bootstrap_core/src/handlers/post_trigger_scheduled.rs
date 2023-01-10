use crate::types::*;

const OP_TRIGGER_SCHEDULED: &str = "trigger_scheduled";
const OP_TRIGGER_SCHEDULED_FORCE: &str = "trigger_scheduled_force";

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

            let res = crate::exec_scheduled(kv, host, false).await?;

            Ok(HttpResponse {
                status: 200,
                headers: vec![("content-type".into(), "text/plain".into())],
                body: res.into_bytes(),
            })
        })
    }
}

/// Handler for method: "POST", op: "trigger_scheduled_force".
/// Manually trigger the "scheduled" cron event
pub struct PostTriggerScheduledForce;

impl AsRequestHandler for PostTriggerScheduledForce {
    fn handles_method(&self) -> &'static str {
        super::METHOD_POST
    }

    fn handles_op(&self) -> &'static str {
        OP_TRIGGER_SCHEDULED_FORCE
    }

    fn handle<'a>(
        &'a self,
        kv: &'a dyn AsKV,
        host: &'a dyn AsFromHost,
        input: &'a [u8],
    ) -> BCoreFut<'a, BCoreResult<HttpResponse>> {
        bcore_fut(async move {
            if !input.is_empty() {
                return Err("body must be empty for 'POST/trigger_scheduled_force'".into());
            }

            let res = crate::exec_scheduled(kv, host, true).await?;

            Ok(HttpResponse {
                status: 200,
                headers: vec![("content-type".into(), "text/plain".into())],
                body: res.into_bytes(),
            })
        })
    }
}
