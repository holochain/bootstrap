import * as Crypto from '../crypto/crypto'
import * as D from 'io-ts/Decoder'
import { Uint8ArrayDecoder, FixedSizeUint8ArrayDecoderBuilder } from '../io/io'

// kitsuneBin is the concatenation of:
// - 4 byte location
// - 32 byte hash
// Total is 36 bytes.
export const kitsuneBinLength = 36
export const Bin = Uint8ArrayDecoder
export type Bin = D.TypeOf<typeof Bin>

// kitsuneSpace is a standard kitsuneBin that is the DNA hash for a DHT network.
export const spaceLength = kitsuneBinLength
export const Space = FixedSizeUint8ArrayDecoderBuilder(spaceLength)
export type Space = D.TypeOf<typeof Space>

// kitsuneAgent is a standard kitsuneBin that is the agent public key.
export const agentLength = kitsuneBinLength
export const Agent = FixedSizeUint8ArrayDecoderBuilder(agentLength)
export type Agent = D.TypeOf<typeof Agent>

// kitsuneSignature is a non-standard kitsuneBin.
// It is 64 literal bytes for an Ed25519 signature WITHOUT location bytes.
export const signatureLength = Crypto.signatureLength
export const Signature = FixedSizeUint8ArrayDecoderBuilder(signatureLength)
export type Signature = D.TypeOf<typeof Signature>

// Extracting the public key from an Agent means stripping the additional
// location bytes and hash prefix.
export const toPublicKey = (bin:Bin):Uint8Array =>
 bin.slice(0,-4)
