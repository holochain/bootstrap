import * as NaCl from 'tweetnacl'

export const keypair = () => NaCl.sign.keyPair()
