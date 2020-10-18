import { isRight, isLeft } from 'fp-ts/lib/Either'
import { kitsuneBin, kitsuneSpace, kitsuneAgent, kitsuneSignature } from '../../src/kitsune/kitsune'
import { strict as assert } from 'assert'

describe('kitsune ts-io', () => {

 it('KitsuneBin decodes correctly', () => {
  // Any number of bytes is a valid KitsuneBin.
  assert.ok(isRight(kitsuneBin.decode(Uint8Array.from(Array(5)))))
 })

 it('KitsuneSpace decodes correctly', () => {
  // KitsuneSpace must be 32 bytes.
  assert.ok(isRight(kitsuneSpace.decode(Uint8Array.from(Array(32)))))

  assert.ok(isLeft(kitsuneSpace.decode(Uint8Array.from(Array(33)))))
  assert.ok(isLeft(kitsuneSpace.decode(Uint8Array.from(Array(34)))))
 })

 it('KitsuneAgent decodes correctly', () => {
  // KitsuneAgent must be 32 bytes.
  assert.ok(isRight(kitsuneAgent.decode(Uint8Array.from(Array(32)))))

  assert.ok(isLeft(kitsuneAgent.decode(Uint8Array.from(Array(31)))))
 })

 it('KitsuneSignature decodes correctly', () => {
  // KitsuneSignature must be 64 bytes.
  assert.ok(isRight(kitsuneSignature.decode(Uint8Array.from(Array(64)))))

  assert.ok(isLeft(kitsuneSignature.decode(Uint8Array.from(Array(32)))))
 })

})
