import * as base64 from 'base64-js'

export type Value = string

// Convert a Uint8Array to base64.
export function fromBytes(a: Uint8Array): Value {
  return base64.fromByteArray(a)
}

// Convert base64 string to a Uint8Array.
export function toBytes(b: Value): Uint8Array {
  return base64.toByteArray(b)
}
