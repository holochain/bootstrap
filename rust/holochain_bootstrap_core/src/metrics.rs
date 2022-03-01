use alloc::vec::Vec;

/// kv prefix for metric entries
pub const METRIC_PREFIX: &str = "bootstrap_metric:";

/// single metric entry structure
#[derive(Default)]
pub struct Metrics {
    pub total_agent_count: u64,
    pub total_space_count: u64,
    pub total_proxy_count: u64,
}

impl Metrics {
    /// msgpack encode this metric entry
    pub fn encode(&self) -> Vec<u8> {
        let mut out = Vec::with_capacity(64);
        let mut enc = msgpackin_core::encode::Encoder::new();
        out.extend_from_slice(&enc.enc_arr_len(3));
        out.extend_from_slice(&enc.enc_num(self.total_agent_count));
        out.extend_from_slice(&enc.enc_num(self.total_space_count));
        out.extend_from_slice(&enc.enc_num(self.total_proxy_count));
        out
    }

    /// msgpack decode this metric entry
    #[allow(dead_code)]
    pub fn decode(data: &[u8]) -> Self {
        use msgpackin_core::decode::*;

        let mut out = Metrics::default();
        let mut dec = Decoder::new();
        let mut iter = dec.parse(data);
        let mut len = match iter.next() {
            Some(Token::Len(LenType::Arr, len)) => len,
            _ => return out,
        };
        match iter.next() {
            Some(Token::Num(n)) => out.total_agent_count = n.to(),
            _ => return out,
        };
        len -= 1;
        if len == 0 {
            return out;
        }
        match iter.next() {
            Some(Token::Num(n)) => out.total_space_count = n.to(),
            _ => return out,
        };
        len -= 1;
        if len == 0 {
            return out;
        }
        match iter.next() {
            Some(Token::Num(n)) => out.total_proxy_count = n.to(),
            _ => return out,
        };
        out
    }
}
