//! Agent Info Structs

use crate::decode::*;
use crate::types::*;

/// Struct for decoding agent info
pub struct AgentInfoRef<'a> {
    /// space this agent is part of
    pub space: &'a [u8],

    /// agent id / pubkey
    pub agent: &'a [u8],

    /// urls this agent is reachable at
    pub urls: Vec<&'a str>,

    /// timestamp this blob was signed
    pub signed_at_ms: f64,

    /// WARNING this is NOT an absolute timestamp,
    /// but an offset from the signed_at_ms field
    pub expires_after_ms: f64,

    /// additional opaque meta-info
    pub meta_info: &'a [u8],
}

impl std::fmt::Debug for AgentInfoRef<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
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

impl AgentInfoRef<'_> {
    /// parse an encoded message-pack agent-info blob into an AgentInfoRef
    pub fn decode(buf: &[u8]) -> BCoreResult<AgentInfoRef<'_>> {
        let tmp = MpValue::decode(buf)?;

        let mut space = None;
        let mut agent = None;
        let mut urls = None;
        let mut signed_at_ms = None;
        let mut expires_after_ms = None;
        let mut meta_info = None;

        for (key, val) in tmp.into_map()? {
            match key.into_str()? {
                "space" => space = Some(val.into_bin()?),
                "agent" => agent = Some(val.into_bin()?),
                "urls" => {
                    let arr = val.into_arr()?;
                    let mut out = Vec::with_capacity(arr.len());
                    for u in arr {
                        out.push(u.into_str()?);
                    }
                    urls = Some(out);
                }
                "signed_at_ms" => signed_at_ms = Some(val.into_num()?),
                "expires_after_ms" => expires_after_ms = Some(val.into_num()?),
                "meta_info" => meta_info = Some(val.into_bin()?),
                oth => return Err(BCoreError::EDecode(format!("unexpected key: {}", oth))),
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

impl std::fmt::Debug for AgentInfoSignedRef<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
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
        let tmp = MpValue::decode(buf)?;

        let mut agent = None;
        let mut signature = None;
        let mut agent_info = None;

        for (key, val) in tmp.into_map()? {
            match key.into_str()? {
                "agent" => agent = Some(val.into_bin()?),
                "signature" => signature = Some(val.into_bin()?),
                "agent_info" => agent_info = Some(val.into_bin()?),
                oth => return Err(BCoreError::EDecode(format!("unexpected key: {}", oth))),
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
        let info = sign.verify_and_decode_agent_info().unwrap();

        println!("{:?}", info);
    }
}
