use crate::agent_info::*;
use crate::types::*;

const OP_PUT: &str = "put";

/// Handler for method: "POST", op: "put".
/// Validate and store an agent_info_signed struct in the bootstrap kv store.
pub struct PostPut;

impl AsRequestHandler for PostPut {
    fn handles_method(&self) -> &'static str {
        super::METHOD_POST
    }

    fn handles_op(&self) -> &'static str {
        OP_PUT
    }

    fn handle<'a>(
        &'a self,
        _kv: &'a dyn AsKV,
        _host: &'a dyn AsFromHost,
        input: &'a [u8],
    ) -> BCoreFut<'a, BCoreResult<HttpResponse>> {
        bcore_fut(async move {
            let sig = AgentInfoSignedRef::decode(input)?;
            let info = sig.verify_and_decode_agent_info()?;
            Err(format!("wasm put disabled: but decoded: {:?}", info).into())
        })
    }
}
