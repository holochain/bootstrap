// Wrapper around whatever backend we choose for messagepack handling.
// This allows us to hot-swap the encoding and decoding lib if we need to.
// Includes a io-ts compatiblity wrapper for use in piped data wrangling.
// The exact format of messagepack data produced by the underlying lib is not
// important because the bootstrap service always performs cryptographic
// verification against the exact bytes produced by the signing agent.
// i.e. the service never attempts to 'recreate' messagepack bytes from
// structured data in order to perform cryptographic operations on it.
// All that matters is that we can deserialize what we need to _after_ all
// signatures are determined to be valid, and serialize anything reasonably for
// downstream.
import * as Lib from '@msgpack/msgpack'
import { Uint8ArrayDecoder } from '../io/io'
import * as D from "io-ts/Decoder"

export function encode(data:unknown):MessagePackData {
 return Lib.encode(data)
}

export function decode(bytes:Uint8Array):any {
 return Lib.decode(bytes)
}

export const messagePackData = Uint8ArrayDecoder
export type MessagePackData = D.TypeOf<typeof messagePackData>

export const messagePackDecoder: D.Decoder<Uint8Array, unknown> = {
 decode: (a: Uint8Array) => {
  try {
   return D.success(Lib.decode(a))
  }
  catch (e) {
   return D.failure(a, e)
  }
 }
}
