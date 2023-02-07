// sometimes it's less confusing to be explicit
#![allow(clippy::needless_lifetimes)]
//! Agent Info Structs

use crate::types::*;
use msgpackin_core::decode::*;

use alloc::vec::Vec;

/// Struct for decoding agent info
pub struct AgentInfoRef<'a> {
    /// space this agent is part of
    pub space: &'a [u8],

    /// agent id / pubkey
    pub agent: &'a [u8],

    /// urls this agent is reachable at
    pub urls: Vec<&'a str>,

    /// timestamp this blob was signed
    pub signed_at_ms: u64,

    /// WARNING this is NOT an absolute timestamp,
    /// but an offset from the signed_at_ms field
    pub expires_after_ms: u64,

    /// additional opaque meta-info
    pub meta_info: &'a [u8],
}

impl core::fmt::Debug for AgentInfoRef<'_> {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        let space = base64::encode(self.space);
        let agent = base64::encode(self.agent);
        let meta_info = base64::encode(self.meta_info);
        f.debug_struct("AgentInfoRef")
            .field("space", &space)
            .field("agent", &agent)
            .field("urls", &self.urls)
            .field("signed_at_ms", &self.signed_at_ms)
            .field("expires_after_ms", &self.expires_after_ms)
            .field("meta_info", &meta_info)
            .finish()
    }
}

fn get_map_len(iter: &mut TokenIter<'_, '_>) -> BCoreResult<u32> {
    Ok(match iter.next() {
        Some(Token::Len(LenType::Map, l)) => l,
        _ => return Err(BCoreError::EDecode("expected map".into())),
    })
}

fn get_str<'dec, 'buf>(iter: &mut TokenIter<'dec, 'buf>) -> BCoreResult<&'buf str> {
    let _len = match iter.next() {
        Some(Token::Len(LenType::Str, l)) => l,
        _ => return Err(BCoreError::EDecode("expected str_len".into())),
    };

    match iter.next() {
        Some(Token::Bin(s)) => {
            core::str::from_utf8(s).map_err(|_| BCoreError::EDecode("str utf8 error".into()))
        }
        _ => Err(BCoreError::EDecode("expected str".into())),
    }
}

fn get_bin<'dec, 'buf>(iter: &mut TokenIter<'dec, 'buf>) -> BCoreResult<&'buf [u8]> {
    let _len = match iter.next() {
        Some(Token::Len(LenType::Bin, l)) => l,
        _ => return Err(BCoreError::EDecode("expected bin_len".into())),
    };

    match iter.next() {
        Some(Token::Bin(b)) => Ok(b),
        _ => Err(BCoreError::EDecode("expected bin".into())),
    }
}

fn get_str_arr<'dec, 'buf>(iter: &mut TokenIter<'dec, 'buf>) -> BCoreResult<Vec<&'buf str>> {
    let len = match iter.next() {
        Some(Token::Len(LenType::Arr, l)) => l,
        _ => return Err(BCoreError::EDecode("expected array".into())),
    };

    let mut out = Vec::with_capacity(len as usize);

    for _ in 0..len {
        out.push(get_str(iter)?);
    }

    Ok(out)
}

fn get_u64(iter: &mut TokenIter<'_, '_>) -> BCoreResult<u64> {
    match iter.next() {
        Some(Token::Num(u)) => Ok(u.to()),
        _ => Err(BCoreError::EDecode("expected unsigned int".into())),
    }
}

impl AgentInfoRef<'_> {
    /// parse an encoded message-pack agent-info blob into an AgentInfoRef
    pub fn decode(buf: &[u8]) -> BCoreResult<AgentInfoRef<'_>> {
        let mut space = None;
        let mut agent = None;
        let mut urls = None;
        let mut signed_at_ms = None;
        let mut expires_after_ms = None;
        let mut meta_info = None;

        let mut dec = Decoder::new();
        let mut iter = dec.parse(buf);

        let len = get_map_len(&mut iter)?;

        for _ in 0..len {
            let key = get_str(&mut iter)?;

            match key {
                "space" => space = Some(get_bin(&mut iter)?),
                "agent" => agent = Some(get_bin(&mut iter)?),
                "urls" => urls = Some(get_str_arr(&mut iter)?),
                "signed_at_ms" => signed_at_ms = Some(get_u64(&mut iter)?),
                "expires_after_ms" => expires_after_ms = Some(get_u64(&mut iter)?),
                "meta_info" => meta_info = Some(get_bin(&mut iter)?),
                oth => return Err(BCoreError::EDecode(format!("unexpected key: {oth}"))),
            }
        }

        Ok(AgentInfoRef {
            space: space.ok_or_else(|| BCoreError::EDecode("no space".into()))?,
            agent: agent.ok_or_else(|| BCoreError::EDecode("no agent".into()))?,
            urls: urls.ok_or_else(|| BCoreError::EDecode("no urls".into()))?,
            signed_at_ms: signed_at_ms
                .ok_or_else(|| BCoreError::EDecode("no signed_at_ms".into()))?,
            expires_after_ms: expires_after_ms
                .ok_or_else(|| BCoreError::EDecode("no expires_after_ms".into()))?,
            meta_info: meta_info.ok_or_else(|| BCoreError::EDecode("no meta_info".into()))?,
        })
    }
}

/// Struct for decoding agent info
pub struct AgentInfoSignedRef<'a> {
    /// agent id / pubkey
    pub agent: &'a [u8],

    /// ed25519 signature over agent_info by the above agent key
    pub signature: &'a [u8],

    /// msgpack encoded agent_info
    pub agent_info: &'a [u8],
}

impl core::fmt::Debug for AgentInfoSignedRef<'_> {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        let agent = base64::encode(self.agent);
        let signature = base64::encode(self.signature);
        let agent_info = base64::encode(self.agent_info);
        f.debug_struct("AgentInfoSignedRef")
            .field("agent", &agent)
            .field("signature", &signature)
            .field("agent_info", &agent_info)
            .finish()
    }
}

impl AgentInfoSignedRef<'_> {
    /// parse an encoded message-pack agent-info blob into an AgentInfoRef
    pub fn decode(buf: &[u8]) -> BCoreResult<AgentInfoSignedRef<'_>> {
        let mut agent = None;
        let mut signature = None;
        let mut agent_info = None;

        let mut dec = Decoder::new();
        let mut iter = dec.parse(buf);

        let len = get_map_len(&mut iter)?;

        for _ in 0..len {
            let key = get_str(&mut iter)?;

            match key {
                "agent" => agent = Some(get_bin(&mut iter)?),
                "signature" => signature = Some(get_bin(&mut iter)?),
                "agent_info" => agent_info = Some(get_bin(&mut iter)?),
                oth => return Err(BCoreError::EDecode(format!("unexpected key: {oth}"))),
            }
        }

        Ok(AgentInfoSignedRef {
            agent: agent.ok_or_else(|| BCoreError::EDecode("no agent".into()))?,
            signature: signature.ok_or_else(|| BCoreError::EDecode("no signature".into()))?,
            agent_info: agent_info.ok_or_else(|| BCoreError::EDecode("no agent_info".into()))?,
        })
    }

    /// verify the signature, if valid, decode the agent info
    /// and perform some additional sanity checks
    pub fn verify_and_decode_agent_info(&self) -> BCoreResult<AgentInfoRef<'_>> {
        if self.agent.len() != 36 {
            return Err(BCoreError::EBadPubKey);
        }

        if self.signature.len() != 64 {
            return Err(BCoreError::EBadSig);
        }

        let pub_key = ed25519_dalek::PublicKey::from_bytes(&self.agent[0..32])
            .map_err(|_| BCoreError::EBadPubKey)?;
        let signature = ed25519_dalek::Signature::from_bytes(&self.signature[0..64])
            .map_err(|_| BCoreError::EBadSig)?;

        use ed25519_dalek::Verifier;
        pub_key
            .verify(self.agent_info, &signature)
            .map_err(|_| BCoreError::EBadSig)?;

        let info = AgentInfoRef::decode(self.agent_info)?;

        if info.agent != self.agent {
            return Err(BCoreError::EBadPubKey);
        }

        Ok(info)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const TEST_SIG_1: &str = "g6lzaWduYXR1cmXEQMNDUQ+j7tA6n+UdI1g3KUty245ihpr6DTt9I7jw8ZZL6kKHlQGwhAGRRAmN1lt8bDXdXotv2CcWf4+l8e6oAQmlYWdlbnTEJF8+ipuTYv6CG1q9FtafNUduCN5aEPyz0HP8Cj/0031zAAAAAKphZ2VudF9pbmZvxLuGpXNwYWNlxCQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAClYWdlbnTEJF8+ipuTYv6CG1q9FtafNUduCN5aEPyz0HP8Cj/0031zAAAAAKR1cmxzkrNodHRwczovL2V4YW1wbGUuY29tr2h0dHBzOi8vZm9vLmNvbaxzaWduZWRfYXRfbXPPAAABfqHDuu6wZXhwaXJlc19hZnRlcl9tc84AAYagqW1ldGFfaW5mb8QA";

    #[test]
    fn deserialize_agent_info() {
        let sign = base64::decode(TEST_SIG_1).unwrap();

        let sign = AgentInfoSignedRef::decode(&sign).unwrap();
        let _info = sign.verify_and_decode_agent_info().unwrap();
    }
}
