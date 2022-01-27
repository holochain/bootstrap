import { Ctx } from '../ctx'
import * as MP from '../msgpack/msgpack'
import * as AgentInfo from '../agent_info/info'
import * as AgentSigned from '../agent_info/signed'
import * as KV from './kv'
import * as D from 'io-ts/Decoder'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'

// The maximum number of milliseconds that agent info will be held by the
// bootstrap service.
// Equal to 1 hour.
export const MAX_HOLD = 60 * 60 * 1000

// Store an AgentInfoSignedRaw under the relevant key.
// Returns error if the AgentInfoSignedRaw does not decode to a safe AgentInfo.
// This includes validation issues such as invalid cryptographic signatures.
// Returns null if everything works and the put is successful.
export async function put(
  agentInfoSignedRawData: MP.MessagePackData,
  ctx: Ctx,
): Promise<E.Either<Error, unknown>> {
  try {
    let doPut = async (
      agentInfoSigned: AgentSigned.AgentInfoSigned,
    ): Promise<E.Either<Error, unknown>> => {
      try {
        let key = KV.agentKey(
          agentInfoSigned.agent_info.space,
          agentInfoSigned.agent_info.agent,
        )
        let value = agentInfoSignedRawData
        // Info expires relative to the time they were signed to enforce that agents
        // produce freshly signed info for each put.
        // Agents MUST explicitly set an expiry time relative to their signature time.
        let expires = Math.min(
          Math.floor(
            (agentInfoSigned.agent_info.expires_after_ms +
              agentInfoSigned.agent_info.signed_at_ms) /
              1000,
          ),
          Date.now() + MAX_HOLD,
        )

        // Cloudflare binds this global to the kv store.
        await ctx.BOOTSTRAP.put(key, value, { expiration: expires })
        return E.right(null)
      } catch (e) {
        if (e instanceof Error) {
          return E.left(e)
        } else {
          return E.left(new Error(JSON.stringify(e)))
        }
      }
    }

    let res: E.Either<Error, Promise<E.Either<Error, unknown>>> = pipe(
      AgentSigned.AgentInfoSignedSafe.decode(agentInfoSignedRawData),
      E.mapLeft((v) => new Error(JSON.stringify(v))),
      E.map(async (agentInfoSignedValue) => {
        return await doPut(agentInfoSignedValue)
      }),
    )

    if (E.isLeft(res)) {
      return res
    } else {
      return await res.right
    }
  } catch (e) {
    if (e instanceof Error) {
      return E.left(e)
    } else {
      return E.left(new Error(JSON.stringify(e)))
    }
  }
}
