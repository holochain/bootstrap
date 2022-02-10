use crate::agent_info::*;
use crate::types::*;

/// Handler for method: "POST", op: "put".
/// Validate and store an agent_info_signed struct in the bootstrap kv store.
pub struct PostPut;

impl AsRequestHandler for PostPut {
    fn handles_method(&self) -> &'static str {
        "POST"
    }

    fn handles_op(&self) -> &'static str {
        "put"
    }

    fn handle<'a>(
        &'a self,
        _kv: &'a dyn AsKV,
        input: &'a [u8],
    ) -> BCoreFut<'a, BCoreResult<HttpResponse>> {
        bcore_fut(async move {
            let sig = AgentInfoSignedRef::decode(input)?;
            let info = sig.verify_and_decode_agent_info()?;
            Err(format!("wasm put disabled: but decoded: {:?}", info).into())
        })
    }
}
