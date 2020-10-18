import * as D from 'io-ts/Decoder'

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
