#![deny(unsafe_code)]
#![deny(missing_docs)]
#![deny(warnings)]
//! Holochain Bootstrap Core logic to be shared with cloudflare worker
//! and standalone rust binary.

use std::future::Future;
use std::collections::HashMap;

/// re-exported dependencies
pub mod dependencies {
    pub use ::ed25519_dalek;
    pub use ::rmp_serde;
    pub use ::serde;
    pub use ::serde_bytes;
}

/// Bootstrap Core Result Type
pub type BcResult<T> = std::result::Result<T, std::io::Error>;

/// Box Future type for trait declarations
pub type BoxFut<'a, T> = std::pin::Pin<Box<dyn Future<Output = T> + 'a>>;

/// Helper fn to generate a BoxFut type
pub fn boxfut<'a, R, F: Future<Output = R> + 'a>(f: F) -> BoxFut<'a, R> {
    Box::pin(f)
}

/// Helper type for fmt_err macro
#[derive(Debug)]
pub struct FmtErr(pub String);
impl std::fmt::Display for FmtErr {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}
impl std::error::Error for FmtErr {}

/// build a std::io::error from format! params
#[macro_export]
macro_rules! fmt_err {
    ($($arg: tt)*) => {{
        ::std::io::Error::new(::std::io::ErrorKind::Other, $crate::FmtErr(format!($($arg)*)))
    }};
}

/// HTTP Response Object
#[derive(Debug)]
pub struct HttpResponse {
    /// the status code
    pub status: u16,

    /// the list of headers to send
    pub headers: Vec<(String, String)>,

    /// the body content
    pub body: Vec<u8>,
}

/// Trait representing a KV implementation
pub trait AsKV: 'static {
    /// put data into the KV
    fn put<'a>(&'a self, key: &'a str, value: &'a [u8]) -> BoxFut<'a, BcResult<()>>;
}

/// Individual Handler Logic
pub trait AsRequestHandler: 'static {
    /// static method returns the method this handler handles, i.e. "POST".
    fn handles_method(&self) -> &'static str;

    /// static method returns the "X-Op" this handler handles, i.e. "now".
    fn handles_op(&self) -> &'static str;

    /// the actual handler logic
    fn handle<'a>(
        &'a self,
        kv: &'a dyn AsKV,
        input: &'a [u8],
    ) -> BoxFut<'a, BcResult<HttpResponse>>;
}

/// Maps request method/ops to correct handlers
pub struct HandlerDispatcher {
    kv: Box<dyn AsKV + 'static>,
    map: HashMap<
        &'static str,
        HashMap<
            &'static str,
            Box<dyn AsRequestHandler + 'static>,
        >,
    >,
}

impl HandlerDispatcher {
    /// construct a new handler dispatcher
    pub fn new<KV: AsKV>(kv: KV) -> Self {
        let kv: Box<dyn AsKV + 'static> = Box::new(kv);
        Self {
            kv,
            map: HashMap::new(),
        }
    }

    /// attach an additional handler instance to this dispatcher
    pub fn attach_handler<H: AsRequestHandler>(&mut self, h: H) {
        let h: Box<dyn AsRequestHandler + 'static> = Box::new(h);
        let method = h.handles_method();
        let op = h.handles_op();
        let map = self.map.entry(method).or_default();
        map.insert(op, h);
    }

    /// dispatch a request to appropriate handler and return response
    pub fn handle<'a> (
        &'a self,
        method: &'a str,
        op: &'a str,
        input: &'a [u8],
    ) -> impl Future<Output = BcResult<HttpResponse>> + 'a {
        let fut: BcResult<BoxFut<BcResult<HttpResponse>>> = (|| {
            let map = self.map.get(method).ok_or_else(|| fmt_err!("invalid method: {}", method))?;
            let h = map.get(op).ok_or_else(|| fmt_err!("invalid op: {}", op))?;
            Ok(h.handle(&*self.kv, input))
        })();
        async move {
            fut?.await
        }
    }
}

/// exporting this so it gets included in the wasm
pub struct Demo;

impl AsRequestHandler for Demo {
    fn handles_method(&self) -> &'static str {
        "POST"
    }

    fn handles_op(&self) -> &'static str {
        "demo"
    }

    fn handle<'a>(
        &'a self,
        kv: &'a dyn AsKV,
        input: &'a [u8],
    ) -> BoxFut<'a, BcResult<HttpResponse>> {
        let fut: BcResult<BoxFut<'a, BcResult<HttpResponse>>> = (|| {
            let put_fut = kv.put("zombies", input);
            Ok(boxfut(async move {
                put_fut.await?;

                static PUBLIC_KEY_BYTES: [u8; 32] = [
                    130, 039, 155, 015, 062, 076, 188, 063,
                    124, 122, 026, 251, 233, 253, 225, 220,
                    014, 041, 166, 120, 108, 035, 254, 077,
                    160, 083, 172, 058, 219, 042, 086, 120, ];

                static SIGNATURE_BYTES: [u8; 64] = [
                    010, 126, 151, 143, 157, 064, 047, 001,
                    196, 140, 179, 058, 226, 152, 018, 102,
                    160, 123, 080, 016, 210, 086, 196, 028,
                    053, 231, 012, 157, 169, 019, 158, 063,
                    045, 154, 238, 007, 053, 185, 227, 229,
                    079, 108, 213, 080, 124, 252, 084, 167,
                    216, 085, 134, 144, 129, 149, 041, 081,
                    063, 120, 126, 100, 092, 059, 050, 011, ];

                let pubkey = ed25519_dalek::PublicKey::from_bytes(&PUBLIC_KEY_BYTES).map_err(|e| fmt_err!("{:?}", e))?;
                let sig = ed25519_dalek::Signature::from_bytes(&SIGNATURE_BYTES).map_err(|e| fmt_err!("{:?}", e))?;
                use ed25519_dalek::Verifier;
                pubkey.verify(&[], &sig).map_err(|e| fmt_err!("{:?}", e))?;

                #[derive(Debug, serde::Serialize, serde::Deserialize)]
                struct SerDeser {
                    #[serde(with = "serde_bytes")]
                    bytes: Vec<u8>,
                    arc: std::sync::Arc<String>,
                }

                let test = SerDeser {
                    bytes: b"hello".to_vec(),
                    arc: std::sync::Arc::new("hello".to_string()),
                };
                let rmp = rmp_serde::to_vec_named(&test).map_err(|e| fmt_err!("{:?}", e))?;
                let out: SerDeser = rmp_serde::from_read_ref(&rmp).map_err(|e| fmt_err!("{:?}", e))?;
                println!("got output: {:?}", out);

                Ok(HttpResponse {
                    status: 200,
                    headers: vec![
                        ("content-type".to_string(), "application/json".to_string()),
                    ],
                    body: b"{\"zombies\": \"yay\"}".to_vec(),
                })
            }))
        })();
        boxfut(async move {
            fut?.await
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn demo() {
        struct DemoKV;

        impl AsKV for DemoKV {
            fn put<'a>(&'a self, key: &'a str, value: &'a [u8]) -> BoxFut<'a, BcResult<()>> {
                println!("DemoKV::put(key: '{}', value: '{}')", key, String::from_utf8_lossy(value));
                boxfut(async move { Ok(()) })
            }
        }

        let mut dispatcher = HandlerDispatcher::new(DemoKV);
        dispatcher.attach_handler(Demo);

        let dispatcher = std::sync::Arc::new(dispatcher);

        let fut = dispatcher.handle("POST", "demo", b"test-input");
        futures::executor::block_on(fut).unwrap();
    }
}