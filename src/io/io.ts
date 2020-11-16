import * as D from 'io-ts/Decoder'
import { pipe } from "fp-ts/lib/pipeable"

// Decoder for a Uint8Array of any length.
// Also supports Buffers as input.
export const Uint8ArrayDecoder: D.Decoder<unknown, Uint8Array> = {
 decode: (a: unknown) => {
  if (a instanceof Uint8Array) {
   return D.success(a)
  }
  if (a instanceof Buffer) {
   return D.success(Uint8Array.from(a))
  }
  return D.failure(a, JSON.stringify(a) + ' cannot be decoded as a Uint8Array')
 }
}

// Decoder factory for Uint8Array data with a fixed size.
// The fixed size is constant per-factory.
export const FixedSizeUint8ArrayDecoderBuilder = (n: number) => pipe(
 Uint8ArrayDecoder,
 D.refine(
  (input): input is Uint8Array => input.length === n,
  `length must be exactly ${n}`,
 ),
)
