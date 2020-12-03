import * as D from "io-ts/Decoder"
import * as Kitsune from '../kitsune/kitsune'
import * as MP from '../msgpack/msgpack'
import { Uint8ArrayDecoder } from '../io/io'
import { pipe } from 'fp-ts/lib/pipeable'
import * as E from 'fp-ts/lib/Either'
import * as _ from 'lodash'

// Size limit on URLs _as bytes_.
// It is important that this counts the bytes and not string characters because
// string handling is complex and subtle across different languages whereas the
// utf8 byte length is always well defined.
export const MAX_URL_SIZE = 2048

// The maximum numbers of urls that a single agent can register.
export const MAX_URLS = 256

// The number of milliseconds we will accept for a signature in the future.
// This allows leeway for agents with a clock that is 'slightly' different to
// the server time.
// Agents are strongly encouraged to use the `now` op as a preflight task for a
// conductor session in order to gauge for themselves whether their local time
// is safe for use as a signature timestamp.
export const NOW_THRESHOLD_MS = 10000

// The maximum number of milliseconds that agent info will be valid relative to
// its signature time.
// Equal to 1 hour.
export const MAX_EXPIRES = 60 * 60 * 1000

// The minimum number of milliseconds that agent info must be valid for relative
// to its signature time.
// Equal to 1 minute.
export const MIN_EXPIRES = 60 * 1000

// The local now as reported by the operating system and returned by the `now`
// op + a threshold in milliseconds. If an agent has a clock ahead of us by less
// than the threshold we will still accept it to compensate for minor jitter
// such as networking issues.
// The safety of this assumes that NOW_THRESHOLD_MS is negligible relative to
// MIN_EXPIRES.
export const now = ():number =>
 Date.now() + NOW_THRESHOLD_MS

// A single url an agent can be found at.
// Each url has a maximum size in bytes and is a valid utf8 string.
export const Url = pipe(
 D.string,
 D.refine(
  (input): input is string => Buffer.byteLength(input, 'utf8') <= MAX_URL_SIZE,
  `URL cannot be longer than ${MAX_URL_SIZE} bytes.`,
 ),
)
export type Url = D.TypeOf<typeof Url>

// A list of urls an agent can be found at.
// There is a limit to the numbers of urls a single agent can register.
export const Urls = pipe(
 D.array(D.string),
 D.refine(
  (input): input is Array<string> => input.length <= MAX_URLS,
  `Agents cannot have more than ${MAX_URLS} urls.`,
 ),
)
export type Urls = D.TypeOf<typeof Urls>

// Messagepack serialized representation of AgentInfo.
export const AgentInfoPacked = Uint8ArrayDecoder
export type AgentInfoPacked = D.TypeOf<typeof AgentInfoPacked>

// Time the agent signed the data, in the agent's own opinion.
// Unix milliseconds.
export const SignedAtMs = D.number
export type SignedAtMs = D.TypeOf<typeof SignedAtMs>

// Decoded SignedAtMs with various sanity checks applied.
export const SignedAtMsSafe: D.Decoder<number, number> = {
 decode: (a:number) => {
  return pipe(
   D.number.decode(a),
   E.chain(signedAtMs => {

    // Milliseconds must be an integer.
    if ( !Number.isInteger(signedAtMs) ) {
     return D.failure(
      a,
      'signed at ms is not an integer ' + signedAtMs,
     )
    }

    // Time must be positive.
    if ( signedAtMs <= 0 ) {
     return D.failure(
      a,
      'signed at ms is negative ' + signedAtMs,
     )
    }

    // Signatures must happen in the past.
    let now_ms = now()
    if (now_ms < signedAtMs) {
     return D.failure(
      a,
      'signed at ms ' + signedAtMs + ' is in the future relative to now ' + now_ms
     )
    }

    return D.success(signedAtMs)
   })
  )
 }
}

// Time the agent wishes to be found at the published location.
// NOT a guarantee that the agent will be found at this location as disconnects
// and other network issues are unavoidable. If many agents cannot be found
// within their expiry times this may indicate some kind of attack or other
// issue with the bootstrap service.
// Time in milliseconds relative to the signing time.
export const ExpiresAfterMs = D.number
export type ExpiresAfterMs = D.TypeOf<typeof ExpiresAfterMs>

// Decoded ExpiresAfterMs with various sanity checks applied.
export const ExpiresAfterMsSafe: D.Decoder<number, number> = {
 decode: (a:number) => {
  return pipe(
   D.number.decode(a),
   E.chain(expiresAfterMs => {

    // Milliseconds must be an integer.
    if ( !Number.isInteger(expiresAfterMs) ) {
     return D.failure(
      a,
      'expires after time is not an integer ' + expiresAfterMs,
     )
    }

    // Expiry times cannot be too short.
    if ( expiresAfterMs < MIN_EXPIRES ) {
     return D.failure(
      a,
      'expires after time ' + expiresAfterMs + ' is less than min expiry time ' + MIN_EXPIRES,
     )
    }

    // Expiry times cannot be too long.
    if ( expiresAfterMs > MAX_EXPIRES ) {
     return D.failure(
      a,
      'expires after time ' + expiresAfterMs + ' is longer than max expiry time ' + MAX_EXPIRES,
     )
    }

    return D.success(expiresAfterMs)
   })
  )
 }
}

export const AgentInfo = D.type({
 // Each agent info is specific to one space.
 // Many active spaces implies many active agent infos, even if the network
 // connection used by the agent is identical for all spaces.
 space: Kitsune.Space,
 // The agent public key.
 agent: Kitsune.Agent,
 // List of urls the agent can be connected to at.
 urls: Urls,
 // Unix timestamp milliseconds the info was signed.
 signed_at_ms: SignedAtMsSafe,
 // Milliseconds after which this info expires relative to the signature time.
 expires_after_ms: ExpiresAfterMsSafe,
})
export type AgentInfo = D.TypeOf<typeof AgentInfo>

export const AgentInfoSafe: D.Decoder<MP.MessagePackData, AgentInfo> = {
 decode: (a: unknown) => {
  return pipe(
   Uint8ArrayDecoder.decode(a),
   E.chain(value => MP.messagePackDecoder.decode(value)),
   E.fold(
    errors => D.failure(a, JSON.stringify(errors)),
    rawValue => pipe(
     AgentInfo.decode(rawValue),
     E.fold(
      errors => D.failure(a, JSON.stringify(errors)),
      agentInfoValue => {
       // Ensure that the decoded AgentInfo matches the generic object.
       // This flags the situation where additional properties were added to
       // the object that were dropped on the AgentInfo. We don't accept this
       // because honest nodes should always sign exactly valid data.
       if (_.isEqual(agentInfoValue, rawValue)) {
        return D.success(agentInfoValue)
       }
       else {
        return D.failure(
         a,
         JSON.stringify(agentInfoValue) + ' does not equal ' + JSON.stringify(rawValue),
        )
       }
      }
     )
    )
   )
  )
 }
}
