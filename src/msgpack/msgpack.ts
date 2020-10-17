import { encode as libEncode, decode as libDecode } from '@msgpack/msgpack'

export function encode(data:unknown):Uint8Array {
 return libEncode(data)
}

export function decode(bytes:Uint8Array):any {
 return libDecode(bytes)
}
