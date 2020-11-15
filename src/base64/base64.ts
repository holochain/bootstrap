export type Value = string

// Convert a Uint8Array to base64.
export function fromBytes(a:Uint8Array):Value {
 return Buffer.from(a).toString('base64')
}

// Convert base64 string to a Uint8Array.
export function toBytes(base64:Value):Uint8Array {
 return Uint8Array.from(Buffer.from(base64, 'base64'))
}
