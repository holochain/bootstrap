import { isRight, isLeft } from 'fp-ts/lib/Either'
import * as Kitsune from '../../src/kitsune/kitsune'
import { strict as assert } from 'assert'

describe('kitsune ts-io', () => {

 it('KitsuneBin decodes correctly', () => {
  // Any number of bytes is a valid KitsuneBin.
  assert.ok(isRight(Kitsune.Bin.decode(Uint8Array.from(Array(5)))))
 })

 it('KitsuneSpace decodes correctly', () => {
  // KitsuneSpace must be the correct length.
  assert.ok(isRight(Kitsune.Space.decode(Uint8Array.from(Array(Kitsune.spaceLength)))))

  assert.ok(isLeft(Kitsune.Space.decode(Uint8Array.from(Array(Kitsune.spaceLength - 1)))))
  assert.ok(isLeft(Kitsune.Space.decode(Uint8Array.from(Array(Kitsune.spaceLength + 1)))))
 })

 it('KitsuneAgent decodes correctly', () => {
  // KitsuneAgent must be the correct length.
  assert.ok(isRight(Kitsune.Agent.decode(Uint8Array.from(Array(Kitsune.agentLength)))))

  assert.ok(isLeft(Kitsune.Agent.decode(Uint8Array.from(Array(Kitsune.agentLength - 1)))))
  assert.ok(isLeft(Kitsune.Agent.decode(Uint8Array.from(Array(Kitsune.agentLength + 1)))))
 })

 it('KitsuneSignature decodes correctly', () => {
  // KitsuneSignature must be the correct length.
  assert.ok(isRight(Kitsune.Signature.decode(Uint8Array.from(Array(Kitsune.signatureLength)))))

  // The normal kitsuneBin length does NOT work for signatures.
  assert.ok(isLeft(Kitsune.Signature.decode(Uint8Array.from(Array(39)))))
 })

})
