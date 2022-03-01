use crate::metrics::*;
use crate::types::*;
use crate::PROXY_PREFIX;

use alloc::boxed::Box;

const HOUR: i64 = 60 * 60;

/// Execute periodic scheduled logic
pub async fn exec_scheduled(kv: &dyn AsKV, host: &dyn AsFromHost) -> BCoreResult<()> {
    let cur_bucket = (host.get_timestamp_millis()? / 1000 / HOUR) * HOUR;
    let cur_bucket_key = format!("{}{}", METRIC_PREFIX, cur_bucket);

    let metric_key_list = kv.list(Some(METRIC_PREFIX)).await?;

    for metric_key in metric_key_list {
        if metric_key == cur_bucket_key {
            // we've already aggregated this bucket, don't do the work again.
            // note, this is not an atomic check, it's possible we'll still
            // do the work again, but this mitigates that chance, and it's
            // not a big deal if it's done multiple times.
            return Ok(());
        }
    }

    let mut metrics = Metrics::default();
    let mut space_set = alloc::collections::BTreeSet::new();

    // progressive list because this list could be huge
    // and we don't have that much memory in wasm
    kv.list_progressive(
        None,
        Box::new(|keys| {
            for key in keys.drain(..) {
                let bkey = key.as_bytes();
                if &bkey[..METRIC_PREFIX.as_bytes().len()] == METRIC_PREFIX.as_bytes() {
                    // ignore
                } else if &bkey[..PROXY_PREFIX.as_bytes().len()] == PROXY_PREFIX.as_bytes() {
                    metrics.total_proxy_count += 1;
                } else if bkey.len() >= 80 {
                    // alas, there's some wiggle room in the way
                    // space / agents are currently encoded as keys
                    // let's just take the first 30 bytes (40 in base64)
                    // because we can reasonably assume that is unique
                    let space = &bkey[..40];
                    let space = base64::decode(space)
                        .map_err(|e| BCoreError::from(format!("{:?} full_key: {}", e, key)))?;
                    space_set.insert(space);
                    metrics.total_agent_count += 1;
                }
            }

            Ok(())
        }),
    )
    .await?;
    metrics.total_space_count = space_set.len() as u64;

    const ONE_WEEK_S: f64 = 60.0 * 60.0 * 24.0 * 7.0;
    kv.put(&cur_bucket_key, &metrics.encode(), ONE_WEEK_S)
        .await?;

    Ok(())
}
