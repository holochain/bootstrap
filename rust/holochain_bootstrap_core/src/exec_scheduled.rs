use crate::metrics::*;
use crate::types::*;
use crate::PROXY_PREFIX;

use alloc::boxed::Box;

const MAX_ENTRIES: usize = 160; // ~ 1 weeks worth at 1 per hour
const HOUR: i64 = 60 * 60;

/// Execute periodic scheduled logic
pub async fn exec_scheduled(
    kv: &dyn AsKV,
    host: &dyn AsFromHost,
    force: bool,
) -> BCoreResult<alloc::string::String> {
    match (move || async move {
        let ma_last_run = if let Ok(lr) = kv.get(MA_LAST_RUN).await {
            lr
        } else {
            alloc::vec::Vec::new().into_boxed_slice()
        };

        let cur_bucket = format!("{}", (host.get_timestamp_millis()? / 1000 / HOUR) * HOUR,);

        if !force && &*ma_last_run == cur_bucket.as_bytes() {
            // we've already run an aggregation for this bucket, exit early
            return BCoreResult::Ok("exec_scheduled already run this bucket\n".into());
        }

        kv.put(MA_LAST_RUN, cur_bucket.as_bytes(), ONE_WEEK_S)
            .await?;

        let mut agg: alloc::vec::Vec<alloc::string::String> =
            if let Ok(agg) = kv.get(METRICS_AGG).await {
                alloc::string::String::from_utf8_lossy(&agg)
                    .split(",\n")
                    .map(|s| s.into())
                    .take(MAX_ENTRIES)
                    .collect()
            } else {
                alloc::vec::Vec::new()
            };

        let mut space_set = alloc::collections::BTreeSet::new();
        let mut total_agent_count = 0;
        let mut total_proxy_count = 0;

        // progressive list because this list could be huge
        // and we don't have that much memory in wasm
        kv.list_progressive(
            None,
            Box::new(|keys| {
                for key in keys.drain(..) {
                    let bkey = key.replace("%2F", "/").replace("%2f", "/");
                    let bkey = bkey.as_bytes();
                    if bkey == MA_LAST_RUN.as_bytes()
                        || bkey == METRICS_AGG.as_bytes()
                        || &bkey[..METRIC_PREFIX.as_bytes().len()] == METRIC_PREFIX.as_bytes()
                    {
                        // ignore
                    } else if &bkey[..PROXY_PREFIX.as_bytes().len()] == PROXY_PREFIX.as_bytes() {
                        total_proxy_count += 1;
                    } else if bkey.len() >= 80 {
                        // alas, there's some wiggle room in the way
                        // space / agents are currently encoded as keys
                        // let's just take the first 30 bytes (40 in base64)
                        // because we can reasonably assume that is unique
                        let space = &bkey[..40];
                        let space = base64::decode(space)
                            .map_err(|e| BCoreError::from(format!("{e:?} full_key: {key}")))?;
                        space_set.insert(space);
                        total_agent_count += 1;
                    }
                }

                Ok(())
            }),
        )
        .await?;

        let total_space_count = space_set.len() as u64;

        agg.push(format!(
            "    [{cur_bucket}, {total_agent_count}, {total_space_count}, {total_proxy_count}]",
        ));

        kv.put(METRICS_AGG, agg.join(",\n").as_bytes(), ONE_WEEK_S)
            .await?;

        BCoreResult::Ok("exec_scheduled complete\n".into())
    })()
    .await
    {
        Ok(r) => Ok(r),
        Err(err) => Ok(format!("{err:?}")),
    }
}
