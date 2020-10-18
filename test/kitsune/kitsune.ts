import { isRight, isLeft } from 'fp-ts/lib/Either'
import { kitsuneBinDecoder } from '../../src/kitsune/kitsune'
import { strict as assert } from 'assert'

describe('kitsune ts-io', () => {

 it('KitsuneBin decodes correctly', () => {
  for (let decodes of [
   Uint8Array.from([1, 2, 3]),
   Buffer.from([1, 2, 3]),
  ]) {
   assert.ok(isRight(kitsuneBinDecoder.decode(decodes)))
  }

  for (let notDecodes of [
   null,
   "foo",
   "",
   [1, 2, 3],
  ]) {
   assert.ok(isLeft(kitsuneBinDecoder.decode(notDecodes)))
  }
 })

})
