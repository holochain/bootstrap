import { isRight, isLeft } from 'fp-ts/lib/Either'
import { Uint8ArrayDecoder, FixedSizeUint8ArrayDecoderBuilder } from '../../src/io/io'
import { strict as assert } from 'assert'

describe('ts-io', () => {

 it('Uint8Array decodes correctly', () => {
  for (let decodes of [
   // Uint8Array of any length will decode.
   Uint8Array.from([1, 2, 3]),
   // Buffer will be decoded to a Uint8Array.
   Buffer.from([1, 2, 3]),
  ]) {
   assert.ok(isRight(Uint8ArrayDecoder.decode(decodes)))
  }

  for (let notDecodes of [
   // Obviously bad.
   null,
   "foo",
   "",
   // Arrays are not Uint8Arrays.
   [1, 2, 3],
  ]) {
   assert.ok(isLeft(Uint8ArrayDecoder.decode(notDecodes)))
  }
 })

 it('FixedSizeUint8ArrayDecoder decodes correctly', () => {

  let decoder = FixedSizeUint8ArrayDecoderBuilder(5)

  for (let decodes of [
   // Both of these need to be exactly 5 bytes.
   Uint8Array.from([1, 2, 3, 4, 5]),
   Buffer.from([1, 2, 3, 4, 5]),
  ]) {
   assert.ok(isRight(decoder.decode(decodes)))
  }

  for (let notDecodes of [
   // This is not 5 bytes so it won't decode.
   Uint8Array.from([1, 2, 3]),
   // These can't decode because Uint8Array doesn't decode.
   null,
   "foo",
   "",
   [1, 2, 3],
  ]) {
   assert.ok(isLeft(decoder.decode(notDecodes)))
  }
 })

})
