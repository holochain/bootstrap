//! Built-in common bootstrap handlers

const METHOD_POST: &str = "POST";

mod post_put;
pub use post_put::*;

mod post_proxy_list;
pub use post_proxy_list::*;

mod post_trigger_scheduled;
pub use post_trigger_scheduled::*;
