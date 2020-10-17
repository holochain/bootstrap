import { sign as naclSign } from 'tweetnacl'
// @todo use wasm key manager
// import { KeyManager } from '@holo-host/wasm-key-manager'

export namespace Ed25519 {
 // Length of signing public key in bytes.
 export const publicKeyLength:number = naclSign.publicKeyLength
 // Length of seed for deterministic secret generation in bytes.
 export const seedLength = naclSign.seedLength
 // Length of signing secret key in bytes.
 export const secretKeyLength:number =naclSign.secretKeyLength
 // Length of a signature in bytes.
 export const signatureLength:number = naclSign.signatureLength

 // Define a list of bytes for ed25519 crypto usage as a Uint8Array.
 export type Bytes = Uint8Array
 export type Secret = Bytes
 export type Public = Bytes
 export type Signature = Bytes
 export type Message = Bytes

 export function base64ToBytes(base64:string):Bytes {
  return Uint8Array.from(Buffer.from(base64, 'base64'))
 }

 // sign a message
 // not really used by the running server but very useful for testing
 export function sign(message:Message, secret:Secret):Ed25519.Signature {
  return naclSign.detached(message, secret)
 }

 // verify a message
 // this is the main workhorse for server security
 export function verify(message:Message, signature:Signature, pubkey:Public):boolean {
  return naclSign.detached.verify(message, signature, pubkey)
 }
}
