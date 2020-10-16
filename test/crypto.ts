import { Ed25519 } from '../src/crypto'
import { strict as assert } from 'assert'
import { aliceSecret, alicePublic, bobSecret, bobPublic } from './agents'

describe('base64 handling', () => {
 it('should convert base64 strings to u8 int arrays', () => {
  const base64 = '123ABC'
  const bytes = Uint8Array.from([215, 109, 192, 4])

  assert.deepEqual(
   Ed25519.base64ToBytes(base64),
   bytes,
  )
 })
})

describe('validate signatures', () => {
 it('should validate detached messages', () => {
  const message = Uint8Array.from([1, 2, 3])
  const validSignature:Ed25519.Signature = Ed25519.sign(message, aliceSecret)
  const expectedSignature:Ed25519.Signature = Uint8Array.from([
   102, 157, 250, 53, 43, 115, 143, 168, 17, 224, 125, 51, 134, 37, 117, 227,
   33, 189, 83, 217, 175, 137, 140, 159, 208, 101, 134, 108, 167, 194, 167, 112,
   144, 249, 5, 144, 44, 34, 39, 108, 47, 67, 155, 197, 62, 147, 192, 63, 238,
   18, 148, 74, 37, 114, 22, 87, 229, 250, 237, 157, 1, 205, 69, 11
  ])
  assert.deepEqual(validSignature, expectedSignature)

  // should verify true when everything lines up
  assert.ok(Ed25519.verify(message, validSignature, alicePublic))

  // none of these are valid
  for (let [m, sig, pub] of [
   [Uint8Array.from([1, 2]), validSignature, alicePublic],
   [message, validSignature, bobPublic],
   [message, Ed25519.sign(message, bobSecret), alicePublic]
  ]) {
   assert.ok(!Ed25519.verify(m, sig, pub))
  }
 })
})
