import * as D from "io-ts/Decoder"
import * as NaCl from 'tweetnacl'
import { FixedSizeUint8ArrayDecoderBuilder, Uint8ArrayDecoder } from '../io/io'

// Defer to tweetnacl for signing pubkey length.
export const publicKeyLength:number = NaCl.sign.publicKeyLength
export const PublicKey = FixedSizeUint8ArrayDecoderBuilder(publicKeyLength)
export type PublicKey = D.TypeOf<typeof PublicKey>

// Seed is for deterministic secret generation in bytes.
// Strongly recommended to not use this directly without some kind of key
// stretching algorithm, e.g. scrypt or argon2id.
export const seedLength:number = NaCl.sign.seedLength
export const Seed = FixedSizeUint8ArrayDecoderBuilder(seedLength)
export type Seed = D.TypeOf<typeof Seed>

// Defer to tweetnacl for signing private key length.
// This should never be used outside of testing because we only want to verify
// signatures in production, never store private keys or sign anything.
// @todo this may change in the future if the bootstrap service is expected to
// sign its own responses to ops for agent-centric auditing.
export const secretKeyLength:number = NaCl.sign.secretKeyLength
export const SecretKey = FixedSizeUint8ArrayDecoderBuilder(secretKeyLength)
export type SecretKey = D.TypeOf<typeof SecretKey>

// Defer to tweetnacl for the length of a signature.
export const signatureLength:number = NaCl.sign.signatureLength
export const Signature = FixedSizeUint8ArrayDecoderBuilder(signatureLength)
export type Signature = D.TypeOf<typeof Signature>

// Messages can be any length but they must be binary data.
export const Message = Uint8ArrayDecoder
export type Message = D.TypeOf<typeof Message>

// Sign a message.
// NOT used by the server but useful for testing.
export function sign(message:Message, secret:SecretKey):Signature {
 return NaCl.sign.detached(message, secret)
}

// Verify a message.
// The main workhorse for server security.
// This is the only cryptography used in production.
export function verify(message:Message, signature:Signature, pubkey:PublicKey):boolean {
 return NaCl.sign.detached.verify(message, signature, pubkey)
}
