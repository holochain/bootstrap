import * as Base64 from '../base64/base64'
import * as Kitsune from '../kitsune/kitsune'
import * as D from "io-ts/Decoder"
import { FixedSizeUint8ArrayDecoderBuilder } from '../io/io'

// The key _bytes_ are different to the base64 encoded representation.
// The byte representation is simply the space and pubkey bytes concatenated.
// The base64 representation has the space and pubkey separately encoded
// _before_ they are concatenated as two strings.
// @see agentKey()
export const keyLength = Kitsune.spaceLength + Kitsune.agentLength
export const Key = FixedSizeUint8ArrayDecoderBuilder(keyLength)
export type Key = D.TypeOf<typeof Key>

// Constructs a key for a space and agent pair that makes sense for cloudflare
// prefix lookups.
// i.e. concatenates two _separate_ base64 encoded binaries of space/agent
// which is different to the base64 encoding of the concatenated binaries
// i.e. we concatenate the strings to preserve a 'prefix' that matches the space
export function agentKey(space:Kitsune.Space, agent:Kitsune.Agent):Base64.Value {
 return '' + Base64.fromBytes(space) + Base64.fromBytes(agent)
}
