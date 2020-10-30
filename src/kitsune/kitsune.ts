import { Ed25519 } from '../crypto/crypto'
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
export const signatureLength = Ed25519.signatureLength
export const Signature = FixedSizeUint8ArrayDecoderBuilder(signatureLength)
export type Signature = D.TypeOf<typeof Signature>

// Direct port of the byte_to_loc function in kitsune_p2p rust.
// Interprets the first 4 bytes of a Uint8Array as a little endian u32.
const bytesToLocation = (bytes:Uint8Array):Uint8Array =>
 // @todo is the u32-ness important?
 // is it enough to simply take the first 4 bytes?
 // new DataView(bytes.buffer.slice(0,4)).getUint32(0, true)
 bytes.slice(0,4)

// Kitsune hashes are expected to be 36 bytes.
// The first 32 bytes are the proper hash.
// The final 4 bytes are a hash-of-the-hash that can be treated like a u32
// "location".
export const fromBytes = (bytes:Uint8Array):Uint8Array =>
 Uint8Array.from([...bytes, ...bytesToLocation(bytes)])

export const toBytes = (bin:Bin):Uint8Array =>
 bin.slice(0,-4)
