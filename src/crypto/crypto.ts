import * as D from "io-ts/Decoder"
import { sign as naclSign } from 'tweetnacl'
import { FixedSizeUint8ArrayDecoderBuilder, Uint8ArrayDecoder } from '../io/io'

export namespace Ed25519 {
 export const publicKeyLength:number = naclSign.publicKeyLength
 export const publicKey = FixedSizeUint8ArrayDecoderBuilder(publicKeyLength)
 export type PublicKey = D.TypeOf<typeof publicKey>

 // Seed is for deterministic secret generation in bytes.
 // Strongly recommended to not use this directly without some kind of key
 // stretching algorithm, e.g. scrypt or argon2id.
 export const seedLength:number = naclSign.seedLength
 export const seed = FixedSizeUint8ArrayDecoderBuilder(seedLength)
 export type Seed = D.TypeOf<typeof seed>

 export const secretKeyLength:number = naclSign.secretKeyLength
 export const secretKey = FixedSizeUint8ArrayDecoderBuilder(secretKeyLength)
 export type SecretKey = D.TypeOf<typeof secretKey>

 export const signatureLength:number = naclSign.signatureLength
 export const signature = FixedSizeUint8ArrayDecoderBuilder(signatureLength)
 export type Signature = D.TypeOf<typeof signature>

 export const message = Uint8ArrayDecoder
 export type Message = D.TypeOf<typeof message>

 export function base64ToBytes(base64:string):Uint8Array {
  return Uint8Array.from(Buffer.from(base64, 'base64'))
 }

 // Sign a message.
 // Not used by the server but useful for testing.
 export function sign(message:Message, secret:SecretKey):Ed25519.Signature {
  return naclSign.detached(message, secret)
 }

 // Verify a message.
 // The main workhorse for server security.
 export function verify(message:Message, signature:Signature, pubkey:PublicKey):boolean {
  return naclSign.detached.verify(message, signature, pubkey)
 }
}
