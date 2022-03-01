//! Bootstrap Core Types Module

use alloc::boxed::Box;
use alloc::string::{String, ToString};
use alloc::vec::Vec;
use core::future::Future;

/// The Bootstrap Core Error Type should be as transparent as possible
/// so it is light-weight in WASM (and translates well into largely
/// string-based javascript error types) but is still functional for
/// the rust-based bootstrap service.
pub enum BCoreError {
    /// Invalid Cryptographic Public Key
    EBadPubKey,

    /// Invalid Cryptographic Signature
    EBadSig,

    /// Unhandled Op Type
    EBadOp {
        /// The passed-in method that was unhandled
        method: String,

        /// The passed-in op that was unhandled
        op: String,
    },

    /// Decode Error
    EDecode(String),

    /// Generic string-based error
    EOther(String),
}

impl From<String> for BCoreError {
    fn from(s: String) -> Self {
        BCoreError::EOther(s)
    }
}

impl From<&String> for BCoreError {
    fn from(s: &String) -> Self {
        s.to_string().into()
    }
}

impl From<&str> for BCoreError {
    fn from(s: &str) -> Self {
        s.to_string().into()
    }
}

impl core::fmt::Debug for BCoreError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        use BCoreError::*;
        match self {
            EBadPubKey => f.write_str("EBadPubKey"),
            EBadSig => f.write_str("EBadSig"),
            EBadOp { method, op } => {
                f.write_str("EBadOp: ")?;
                f.write_str(method)?;
                f.write_str("/")?;
                f.write_str(op)
            }
            EDecode(err) => {
                f.write_str("EDecode: ")?;
                f.write_str(err)
            }
            EOther(oth) => {
                f.write_str("EOther: ")?;
                f.write_str(oth)
            }
        }
    }
}

impl core::fmt::Display for BCoreError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        core::fmt::Debug::fmt(self, f)
    }
}

/// build a BCoreError::EOther from `format!()`-style parameters
#[macro_export]
macro_rules! bcore_err {
    ($($arg: tt)*) => {{
        $crate::types::BCoreError::EOther(::alloc::format!($($arg)*))
    }};
}

/// Bootstrap Core Result Type
pub type BCoreResult<T> = core::result::Result<T, BCoreError>;

/// Future type for trait declarations
pub type BCoreFut<'a, T> = core::pin::Pin<Box<dyn Future<Output = T> + 'a>>;

/// Helper fn to generate a BCoreFut type
pub fn bcore_fut<'a, R, F: Future<Output = R> + 'a>(f: F) -> BCoreFut<'a, R> {
    Box::pin(f)
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

/// Trait representing some functionality supplied by the host environment
/// i.e. wasm
pub trait AsFromHost: 'static {
    /// get milliseconds timestamp
    fn get_timestamp_millis(&self) -> BCoreResult<i64>;
}

/// Trait representing a KV implementation
pub trait AsKV: 'static {
    /// put data into the KV
    fn put<'a>(&'a self, key: &str, value: &[u8], ttl_secs: f64) -> BCoreFut<'a, BCoreResult<()>>;

    /// get data from the KV
    fn get<'a>(&'a self, key: &str) -> BCoreFut<'a, BCoreResult<Box<[u8]>>>;

    /// delete a key from the KV
    fn delete<'a>(&'a self, key: &str) -> BCoreFut<'a, BCoreResult<()>>;

    /// list keys from the KV progressively
    fn list_progressive<'a, 'b: 'a>(
        &'a self,
        prefix: Option<&str>,
        cb: Box<dyn FnMut(&mut Vec<String>) -> BCoreResult<()> + 'b>,
    ) -> BCoreFut<'a, BCoreResult<()>>;

    // -- provided -- //

    /// list keys from the KV
    fn list<'a, 'b: 'a>(
        &'a self,
        prefix: Option<&'b str>,
    ) -> BCoreFut<'a, BCoreResult<Vec<String>>> {
        Box::pin(async move {
            let mut out = Vec::new();
            self.list_progressive(
                prefix,
                Box::new(|keys| {
                    out.append(keys);
                    Ok(())
                }),
            )
            .await?;
            Ok(out)
        })
    }
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
        host: &'a dyn AsFromHost,
        input: &'a [u8],
    ) -> BCoreFut<'a, BCoreResult<HttpResponse>>;
}
