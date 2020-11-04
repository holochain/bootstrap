import * as Kitsune from '../../src/kitsune/kitsune'

export const vaporChatSpace:Kitsune.Space = Uint8Array.from(Array(Kitsune.kitsuneBinLength).fill(0))

export const wikiSpace:Kitsune.Space = Uint8Array.from(Array(Kitsune.kitsuneBinLength).fill(1))

export const emptySpace:Kitsune.Space = Uint8Array.from(Array(Kitsune.kitsuneBinLength).fill(2))
