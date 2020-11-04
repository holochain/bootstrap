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
export const MAX_URLS = 256

export const url = pipe(
 D.string,
 D.refine(
  (input): input is string => Buffer.byteLength(input, 'utf8') <= MAX_URL_SIZE,
  `URL cannot be longer than ${MAX_URL_SIZE} bytes.`,
 ),
)
export type Url = D.TypeOf<typeof url>

export const urls = pipe(
 D.array(D.string),
 D.refine(
  (input): input is Array<string> => input.length <= MAX_URLS,
  `Agents cannot have more than ${MAX_URLS} urls.`,
 ),
)
export type Urls = D.TypeOf<typeof urls>

export const agentInfoPacked = Uint8ArrayDecoder
export type AgentInfoPacked = D.TypeOf<typeof agentInfoPacked>

export const signedAtMs = D.number
export type SignedAtMs = D.TypeOf<typeof signedAtMs>

export const signedAtMsSafe: D.Decoder<number, number> = {
 decode: (a:number) => {
  return pipe(
   D.number.decode(a),
   E.chain(signedAtMs => {
    // Time must be positive.
    if ( signedAtMs <= 0 ) {
     return D.failure(
      a,
      'signed at ms is negative ' + signedAtMs,
     )
    }
    // Signatures must happen in the past.
    let now_ms = Date.now()
    if (now_ms < signedAtMs) {
     return D.failure(
      a,
      'signed at ms ' + signedAtMs + ' is in the future relative to now ' + now_ms
     )
    }
    return D.success(a)
   })
  )
 }
}


export const agentInfo = D.type({
 space: Kitsune.Space,
 agent: Kitsune.Agent,
 urls: urls,
 signed_at_ms: signedAtMsSafe,
})
export type AgentInfo = D.TypeOf<typeof agentInfo>

export const agentInfoSafe: D.Decoder<MP.MessagePackData, AgentInfo> = {
 decode: (a: unknown) => {
  return pipe(
   Uint8ArrayDecoder.decode(a),
   E.chain(value => MP.messagePackDecoder.decode(value)),
   E.fold(
    errors => D.failure(a, JSON.stringify(errors)),
    rawValue => pipe(
     agentInfo.decode(rawValue),
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
