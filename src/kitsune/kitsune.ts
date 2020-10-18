import { Ed25519 } from '../crypto/crypto'
import * as D from 'io-ts/Decoder'
import { Uint8ArrayDecoder, FixedSizeUint8ArrayDecoderBuilder } from '../io/io'

export const kitsuneBin = Uint8ArrayDecoder
export type KitsuneBin = D.TypeOf<typeof kitsuneBin>

export const spaceLength = 32
export const kitsuneSpace = FixedSizeUint8ArrayDecoderBuilder(spaceLength)
export type KitsuneSpace = D.TypeOf<typeof kitsuneSpace>

export const agentLength = Ed25519.publicKeyLength
export const kitsuneAgent = FixedSizeUint8ArrayDecoderBuilder(agentLength)
export type KitsuneAgent = D.TypeOf<typeof kitsuneAgent>

export const kitsuneSignature = FixedSizeUint8ArrayDecoderBuilder(Ed25519.signatureLength)
export type KitsuneSignature = D.TypeOf<typeof kitsuneSignature>
