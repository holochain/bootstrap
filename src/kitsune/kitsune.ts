export namespace KitsuneSignature {
 export type Value = Uint8Array
 export type Encoded = Uint8Array

 export function decode(encoded:KitsuneSignature.Encoded):KitsuneSignature.Value|Error {
  if (encoded.length === 64) {
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

export class KitsuneBin {
 private value: Uint8Array
 constructor(value:Uint8Array) {
  // sometimes this comes in as a buffer so be defensive
  this.value = Uint8Array.from(value)
 }

 encode():KitsuneBin.Encoded {
  return this.value
 }
}

export namespace KitsuneBin {
 export type Value = Uint8Array
 export type Encoded = Uint8Array

 function decode(encoded:KitsuneBin.Encoded):KitsuneBin|Error {
  if (encoded.length === 32) {
   try {
    return new KitsuneBin(encoded)
   }
   catch (e) {
    return e
   }
  }
  return Error(KitsuneBin.name + ' failed to decode ' + JSON.stringify(encoded))
 }
}

export type KitsuneSpace = KitsuneBin
export type KitsuneAgent = KitsuneBin
