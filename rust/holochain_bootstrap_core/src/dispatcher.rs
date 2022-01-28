use crate::types::*;

/// Maps request method/ops to correct handlers
pub struct HandlerDispatcher {
    // reference to KV store
    kv: Box<dyn AsKV + 'static>,

    // rather than using a true map type, we shouldn't have
    // very many handlers, so it results in smaller wasm
    // and not bad performance to just search them each time.
    map: Vec<Box<dyn AsRequestHandler + 'static>>,
}

impl HandlerDispatcher {
    /// construct a new handler dispatcher
    pub fn new<KV: AsKV>(kv: KV) -> Self {
        let kv: Box<dyn AsKV + 'static> = Box::new(kv);
        Self {
            kv,
            map: Vec::new(),
        }
    }

    /// attach an additional handler instance to this dispatcher
    pub fn attach_handler<H: AsRequestHandler>(&mut self, h: H) {
        let h: Box<dyn AsRequestHandler + 'static> = Box::new(h);
        self.map.push(h);
    }

    /// dispatch a request to appropriate handler and return response
    pub async fn handle(&self, method: &str, op: &str, input: &[u8]) -> BCoreResult<HttpResponse> {
        let Self { kv, map } = self;

        for h in map.iter() {
            if h.handles_method() != method {
                continue;
            }
            if h.handles_op() != op {
                continue;
            }
            return h.handle(&**kv, input).await;
        }

        Err(BCoreError::EBadOp {
            method: method.to_string(),
            op: op.to_string(),
        })
    }
}
