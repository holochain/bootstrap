import * as Kitsune from '../../src/kitsune/kitsune'

export const vaporChatSpace:Kitsune.Space = Kitsune.fromBytes(Uint8Array.from(Array(32).fill(0)))

export const wikiSpace:Kitsune.Space = Kitsune.fromBytes(Uint8Array.from(Array(32).fill(1)))

export const emptySpace:Kitsune.Space = Kitsune.fromBytes(Uint8Array.from(Array(32).fill(2)))
