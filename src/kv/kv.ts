import { atob64 } from '../base64/base64'
import * as Kitsune from '../kitsune/kitsune'
import * as D from "io-ts/Decoder"
import { FixedSizeUint8ArrayDecoderBuilder } from '../io/io'

export const keyLength = Kitsune.spaceLength + Kitsune.agentLength
export const key = FixedSizeUint8ArrayDecoderBuilder(keyLength)
export type Key = D.TypeOf<typeof key>

// Constructs a key for a space and agent pair that makes sense for cloudflare
// prefix lookups.
// i.e. concatenates two _separate_ base64 encoded binaries of space/agent
// which is different to the base64 encoding of the concatenated binaries
// i.e. we concatenate the strings to preserve a 'prefix' that matches the space
export function agentKey(space:Kitsune.Space, agent:Kitsune.Agent):string {
 return '' + atob64(space) + atob64(agent)
}
