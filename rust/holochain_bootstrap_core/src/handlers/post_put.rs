use super::*;

/// exporting this so it gets included in the wasm
pub struct PostPut;

#[derive(Debug)]
struct AgentInfoRef<'a> {
    pub space: &'a [u8],
    pub agent: &'a [u8],
    pub urls: Vec<&'a str>,
    pub signed_at_ms: u64,
    pub expires_after_ms: u64,
    pub meta_info: &'a [u8],
}

#[derive(Debug)]
struct AgentInfoSignedRef<'a> {
    pub agent: &'a [u8],
    pub signature: &'a [u8],
    pub agent_info: &'a [u8],
}

fn read_map_len(r: &mut std::io::Cursor<&[u8]>) -> BcResult<usize> {
    let map_marker = rmp::decode::read_marker(r).unwrap();
    match &map_marker {
        rmp::Marker::FixMap(_) | rmp::Marker::Map16 | rmp::Marker::Map32 => (),
        _ => panic!("expected map"),
    }
    let count = rmp::decode::marker_to_len(r, map_marker).unwrap();
    Ok(count as usize)
}

fn read_str<'a>(r: &mut std::io::Cursor<&[u8]>, buf: &'a [u8]) -> BcResult<&'a str> {
    let len = rmp::decode::read_str_len(r).unwrap() as usize;
    let out =
        std::str::from_utf8(&buf[r.position() as usize..r.position() as usize + len]).unwrap();
    r.set_position(r.position() + len as u64);
    Ok(out)
}

fn read_bin<'a>(r: &mut std::io::Cursor<&[u8]>, buf: &'a [u8]) -> BcResult<&'a [u8]> {
    let len = rmp::decode::read_bin_len(r).unwrap() as usize;
    let out = &buf[r.position() as usize..r.position() as usize + len];
    r.set_position(r.position() + len as u64);
    Ok(out)
}

fn read_str_array<'a>(r: &mut std::io::Cursor<&[u8]>, buf: &'a [u8]) -> BcResult<Vec<&'a str>> {
    let len = rmp::decode::read_array_len(r).unwrap() as usize;
    println!("array len: {}", len);
    let mut out = Vec::with_capacity(len);
    for _ in 0..len {
        out.push(read_str(r, buf)?);
    }
    Ok(out)
}

fn read_agent_info(buf: &[u8]) -> BcResult<AgentInfoRef> {
    let mut cursor = std::io::Cursor::new(buf);
    let map_len = read_map_len(&mut cursor)?;
    if map_len != 6 {
        return Err(fmt_err!("expected 6 key map"));
    }
    let mut space = None;
    let mut agent = None;
    let mut urls = None;
    let mut signed_at_ms = None;
    let mut expires_after_ms = None;
    let mut meta_info = None;
    for _ in 0..6 {
        match read_str(&mut cursor, buf)? {
            "space" => space = Some(read_bin(&mut cursor, buf)?),
            "agent" => agent = Some(read_bin(&mut cursor, buf)?),
            "urls" => urls = Some(read_str_array(&mut cursor, buf)?),
            "signed_at_ms" => {
                signed_at_ms = Some(
                    rmp::decode::read_int::<u64, _>(&mut cursor)
                        .map_err(|e| fmt_err!("{:?}", e))?,
                )
            }
            "expires_after_ms" => {
                expires_after_ms = Some(
                    rmp::decode::read_int::<u64, _>(&mut cursor)
                        .map_err(|e| fmt_err!("{:?}", e))?,
                )
            }
            "meta_info" => meta_info = Some(read_bin(&mut cursor, buf)?),
            oth => return Err(fmt_err!("unexpected key: '{}'", oth)),
        }
    }
    let space = space.ok_or(fmt_err!("map did not contain key 'space'"))?;
    let agent = agent.ok_or(fmt_err!("map did not contain key 'agent'"))?;
    let urls = urls.ok_or(fmt_err!("map did not contain key 'urls'"))?;
    let signed_at_ms = signed_at_ms.ok_or(fmt_err!("map did not contain key 'signed_at_ms'"))?;
    let expires_after_ms =
        expires_after_ms.ok_or(fmt_err!("map did not contain key 'expires_after_ms'"))?;
    let meta_info = meta_info.ok_or(fmt_err!("map did not contain key 'meta_info'"))?;
    Ok(AgentInfoRef {
        space,
        agent,
        urls,
        signed_at_ms,
        expires_after_ms,
        meta_info,
    })
}

fn read_agent_info_signed(buf: &[u8]) -> BcResult<AgentInfoSignedRef> {
    let mut cursor = std::io::Cursor::new(buf);
    let map_len = read_map_len(&mut cursor)?;
    if map_len != 3 {
        return Err(fmt_err!("expected 3 key map"));
    }
    let mut agent = None;
    let mut signature = None;
    let mut agent_info = None;
    for _ in 0..3 {
        match read_str(&mut cursor, buf)? {
            "agent" => agent = Some(read_bin(&mut cursor, buf)?),
            "signature" => signature = Some(read_bin(&mut cursor, buf)?),
            "agent_info" => agent_info = Some(read_bin(&mut cursor, buf)?),
            oth => return Err(fmt_err!("unexpected key: '{}'", oth)),
        }
    }
    let agent = agent.ok_or(fmt_err!("map did not contain key 'agent'"))?;
    let signature = signature.ok_or(fmt_err!("map did not contain key 'signature'"))?;
    let agent_info = agent_info.ok_or(fmt_err!("map did not contain key 'agent_info'"))?;
    Ok(AgentInfoSignedRef {
        agent,
        signature,
        agent_info,
    })
}

#[cfg(test)]
mod test {
    use super::*;

    #[derive(Debug, serde::Serialize, serde::Deserialize)]
    struct AgentInfo {
        #[serde(with = "serde_bytes")]
        pub space: Box<[u8]>,

        #[serde(with = "serde_bytes")]
        pub agent: Box<[u8]>,

        pub urls: Vec<String>,

        pub signed_at_ms: u64,

        /// WARNING-this is a weird offset from the signed_at_ms time!!!!
        pub expires_after_ms: u64,

        #[serde(with = "serde_bytes")]
        pub meta_info: Box<[u8]>,
    }

    #[derive(Debug, serde::Serialize, serde::Deserialize)]
    struct AgentInfoSigned {
        #[serde(with = "serde_bytes")]
        pub agent: Box<[u8]>,

        #[serde(with = "serde_bytes")]
        pub signature: Box<[u8]>,

        #[serde(with = "serde_bytes")]
        pub agent_info: Box<[u8]>,
    }

    #[test]
    fn test_manual_decoding() {
        let info = AgentInfo {
            space: b"123456789012345678901234567890123456"
                .to_vec()
                .into_boxed_slice(),
            agent: b"123456789012345678901234567890123456"
                .to_vec()
                .into_boxed_slice(),
            urls: vec!["http://zombie".to_string()],
            signed_at_ms: 42,
            expires_after_ms: 42,
            meta_info: vec![].into_boxed_slice(),
        };
        let info = rmp_serde::to_vec_named(&info).unwrap();
        let signed = AgentInfoSigned {
            agent: b"123456789012345678901234567890123456"
                .to_vec()
                .into_boxed_slice(),
            signature: vec![0; 64].into_boxed_slice(),
            agent_info: info.clone().into_boxed_slice(),
        };
        let signed = rmp_serde::to_vec_named(&signed).unwrap();

        let agent_info = read_agent_info(&info).unwrap();
        println!("GOT: {:?}", agent_info);
        let agent_sig = read_agent_info_signed(&signed).unwrap();
        println!("GOT: {:?}", agent_sig);
    }
}

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
    ) -> BoxFut<'a, BcResult<HttpResponse>> {
        let fut: BcResult<BoxFut<'a, BcResult<HttpResponse>>> = (|| {
            let agent_sig = read_agent_info_signed(input)?;
            //let agent_sig: AgentInfoSigned = rmp_serde::from_read_ref(input).map_err(|e| fmt_err!("{:?}", e))?;

            let pubkey = ed25519_dalek::PublicKey::from_bytes(&agent_sig.agent[0..32])
                .map_err(|e| fmt_err!("{:?}", e))?;
            let sig = ed25519_dalek::Signature::from_bytes(&agent_sig.signature[0..64])
                .map_err(|e| fmt_err!("{:?}", e))?;
            use ed25519_dalek::Verifier;
            pubkey
                .verify(agent_sig.agent_info, &sig)
                .map_err(|e| fmt_err!("{:?}", e))?;

            //let agent_info: AgentInfo = rmp_serde::from_read_ref(&agent_sig.agent_info).map_err(|e| fmt_err!("{:?}", e))?;
            let agent_info = read_agent_info(agent_sig.agent_info)?;

            if agent_sig.agent != agent_info.agent {
                return Err(fmt_err!("agent_info_signed.agent != agent_info.agent"));
            }

            let space64 = base64::encode(agent_info.space);
            let agent64 = base64::encode(agent_info.agent);

            Err(fmt_err!(
                "wasm put disabled, would have put '{}{}'",
                space64,
                agent64
            ))
            /*
            let put_fut = kv.put("zombies", input);
            Ok(boxfut(async move {
                put_fut.await?;

                Ok(HttpResponse {
                    status: 200,
                    headers: Vec::new(),
                    body: Vec::new(),
                })
            }))
            */
        })();
        boxfut(async move { fut?.await })
    }
}
