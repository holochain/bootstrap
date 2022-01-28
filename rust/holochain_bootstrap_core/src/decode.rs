//! Helper utilities for manually decoding message-pack data using rmp
//! directly instead of relying on serde. Serde creates a large amount
//! of wasm bloat.

use crate::types::*;

/// Generic message pack value
#[derive(Debug)]
pub enum MpValue<'lt> {
    /// null data
    Null,

    /// bool data
    Bool(bool),

    /// binary data
    Bin(&'lt [u8]),

    /// string data
    Str(&'lt str),

    /// numerical data
    Num(f64),

    /// array data
    Arr(Vec<MpValue<'lt>>),

    /// map data
    Map(Vec<(MpValue<'lt>, MpValue<'lt>)>),
}

impl<'lt> MpValue<'lt> {
    /// decode a generic message pack value from given serialized buffer
    pub fn decode(buf: &[u8]) -> BCoreResult<MpValue<'_>> {
        let mut cursor = std::io::Cursor::new(buf);

        Self::decode_inner(&mut cursor, buf)
    }

    fn decode_inner<'a>(
        cursor: &mut std::io::Cursor<&[u8]>,
        buf: &'a [u8],
    ) -> BCoreResult<MpValue<'a>> {
        use rmp::Marker;

        match rmp::decode::read_marker(cursor)
            .map_err(|e| BCoreError::EDecode(format!("{:?}", e)))?
        {
            // Map
            Marker::FixMap(_) | Marker::Map16 | Marker::Map32 => {
                cursor.set_position(cursor.position() - 1);
                let len = rmp::decode::read_map_len(cursor).map_err(BCoreError::decode)?;
                let mut out = Vec::with_capacity(len as usize);
                for _ in 0..len {
                    let key = Self::decode_inner(cursor, buf)?;
                    let val = Self::decode_inner(cursor, buf)?;
                    out.push((key, val));
                }
                Ok(MpValue::Map(out))
            }
            // Arr
            Marker::FixArray(_) | Marker::Array16 | Marker::Array32 => {
                cursor.set_position(cursor.position() - 1);
                let len = rmp::decode::read_array_len(cursor).map_err(BCoreError::decode)?;
                let mut out = Vec::with_capacity(len as usize);
                for _ in 0..len {
                    out.push(Self::decode_inner(cursor, buf)?);
                }
                Ok(MpValue::Arr(out))
            }
            // Bin
            Marker::Bin8 | Marker::Bin16 | Marker::Bin32 => {
                cursor.set_position(cursor.position() - 1);
                let len = rmp::decode::read_bin_len(cursor).map_err(BCoreError::decode)?;
                let out =
                    &buf[cursor.position() as usize..cursor.position() as usize + len as usize];
                cursor.set_position(cursor.position() + len as u64);
                Ok(MpValue::Bin(out))
            }
            // Str
            Marker::FixStr(_) | Marker::Str8 | Marker::Str16 | Marker::Str32 => {
                cursor.set_position(cursor.position() - 1);
                let len = rmp::decode::read_str_len(cursor).map_err(BCoreError::decode)?;
                let out = std::str::from_utf8(
                    &buf[cursor.position() as usize..cursor.position() as usize + len as usize],
                )
                .map_err(BCoreError::decode)?;
                cursor.set_position(cursor.position() + len as u64);
                Ok(MpValue::Str(out))
            }
            // Num
            Marker::FixPos(u) => Ok(MpValue::Num(u as f64)),
            Marker::FixNeg(i) => Ok(MpValue::Num(i as f64)),
            Marker::F32 => {
                cursor.set_position(cursor.position() - 1);
                let f = rmp::decode::read_f32(cursor).map_err(BCoreError::decode)?;
                Ok(MpValue::Num(f as f64))
            }
            Marker::F64 => {
                cursor.set_position(cursor.position() - 1);
                let f = rmp::decode::read_f64(cursor).map_err(BCoreError::decode)?;
                Ok(MpValue::Num(f))
            }
            Marker::U8 | Marker::U16 | Marker::U32 | Marker::U64 => {
                cursor.set_position(cursor.position() - 1);
                let u: u64 = rmp::decode::read_int(cursor).map_err(BCoreError::decode)?;
                Ok(MpValue::Num(u as f64))
            }
            Marker::I8 | Marker::I16 | Marker::I32 | Marker::I64 => {
                cursor.set_position(cursor.position() - 1);
                let i: i64 = rmp::decode::read_int(cursor).map_err(BCoreError::decode)?;
                Ok(MpValue::Num(i as f64))
            }
            // Null
            Marker::Null => Ok(MpValue::Null),
            // Bool
            Marker::True => Ok(MpValue::Bool(true)),
            Marker::False => Ok(MpValue::Bool(false)),
            // Unhandled
            oth => Err(BCoreError::EDecode(format!(
                "unhandled msgpack type: {:?}",
                oth
            ))),
        }
    }

    /// error if this value is not the null type
    pub fn into_null(self) -> BCoreResult<()> {
        if let MpValue::Null = self {
            Ok(())
        } else {
            Err(BCoreError::EDecode("not null".into()))
        }
    }

    /// attempt to get this value as a bool
    pub fn into_bool(self) -> BCoreResult<bool> {
        if let MpValue::Bool(b) = self {
            Ok(b)
        } else {
            Err(BCoreError::EDecode("not bool".into()))
        }
    }

    /// attempt to get this value as binary
    pub fn into_bin(self) -> BCoreResult<&'lt [u8]> {
        if let MpValue::Bin(b) = self {
            Ok(b)
        } else {
            Err(BCoreError::EDecode("not bin".into()))
        }
    }

    /// attempt to get this value as a string
    pub fn into_str(self) -> BCoreResult<&'lt str> {
        if let MpValue::Str(s) = self {
            Ok(s)
        } else {
            Err(BCoreError::EDecode("not str".into()))
        }
    }

    /// attempt to get this value as a number
    pub fn into_num(self) -> BCoreResult<f64> {
        if let MpValue::Num(f) = self {
            Ok(f)
        } else {
            Err(BCoreError::EDecode("not num".into()))
        }
    }

    /// attempt to get this value as an array
    pub fn into_arr(self) -> BCoreResult<Vec<MpValue<'lt>>> {
        if let MpValue::Arr(a) = self {
            Ok(a)
        } else {
            Err(BCoreError::EDecode("not arr".into()))
        }
    }

    /// attempt to get this value as a map
    pub fn into_map(self) -> BCoreResult<Vec<(MpValue<'lt>, MpValue<'lt>)>> {
        if let MpValue::Map(m) = self {
            Ok(m)
        } else {
            Err(BCoreError::EDecode("not map".into()))
        }
    }
}
