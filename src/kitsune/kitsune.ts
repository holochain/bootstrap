import { Ed25519 } from '../crypto/crypto'
import * as D from 'io-ts/Decoder'
import { Uint8ArrayDecoder } from '../io/io'

export namespace KitsuneSignature {
 export type Value = Uint8Array
 export type Encoded = Uint8Array

 export function decode(encoded:KitsuneSignature.Encoded):KitsuneSignature.Value|Error {
  if (encoded.length === Ed25519.signatureLength) {
   try {
    return encoded
   }
   catch (e) {
    return e
   }
  }
  return Error('KitsuneSignature failed to decode ' + JSON.stringify(encoded))
 }
}

export type KitsuneSpace = KitsuneBin
export type KitsuneAgent = KitsuneBin

export const kitsuneBinDecoder = Uint8ArrayDecoder

export type KitsuneBin = D.TypeOf<typeof kitsuneBinDecoder>

// export const kitsuneSpaceDecoder:
