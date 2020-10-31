import * as Crypto from '../../src/crypto/crypto'
import { strict as assert } from 'assert'
import * as Agents from '../fixture/agents'
import * as NaCl from 'tweetnacl'

describe('base64 handling', () => {
 it('should convert base64 strings to u8 int arrays', () => {
  const base64 = '123ABC'
  const bytes = Uint8Array.from([215, 109, 192, 4])

  assert.deepEqual(
   Crypto.base64ToBytes(base64),
   bytes,
  )
 })
})

describe('validate signatures', () => {
 it('should validate detached messages', () => {
  const message = Uint8Array.from([1, 2, 3])
  const validSignature:Crypto.Signature = Crypto.sign(message, Agents.alice.secretKey)
  const expectedSignature:Crypto.Signature = NaCl.sign.detached(message, Agents.alice.secretKey)
  assert.deepEqual(validSignature, expectedSignature)

  // should verify true when everything lines up
  assert.ok(Crypto.verify(message, validSignature, Agents.alice.publicKey))

  // none of these are valid
  for (let [m, sig, pub] of [
   [Uint8Array.from([1, 2]), validSignature, Agents.alice.publicKey],
   [message, validSignature, Agents.bob.publicKey],
   [message, Crypto.sign(message, Agents.bob.secretKey), Agents.alice.publicKey]
  ]) {
   assert.ok(!Crypto.verify(m, sig, pub))
  }
 })
})
