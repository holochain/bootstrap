import { encode as libEncode, decode as libDecode } from '@msgpack/msgpack'
import { Uint8ArrayDecoder } from '../io/io'
import * as D from "io-ts/Decoder"

export function encode(data:unknown):Uint8Array {
 return libEncode(data)
}

export function decode(bytes:Uint8Array):any {
 return libDecode(bytes)
}

export const messagePackData = Uint8ArrayDecoder
export type MessagePackData = D.TypeOf<typeof messagePackData>

export const messagePackDecoder: D.Decoder<Uint8Array, unknown> = {
 decode: (a: Uint8Array) => {
  try {
   return D.success(libDecode(a))
  }
  catch (e) {
   return D.failure(a, e)
  }
 }
}
