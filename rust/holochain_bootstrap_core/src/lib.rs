#![no_std]
#![deny(unsafe_code)]
#![deny(missing_docs)]
#![deny(warnings)]
//! Holochain Bootstrap Core logic to be shared with cloudflare worker
//! and standalone rust binary.

#[macro_use]
extern crate alloc;

pub mod types;

mod dispatcher;
pub use dispatcher::*;

pub mod agent_info;

pub mod handlers;
