import * as MP from '../msgpack/msgpack'

export const now = async (_:MP.MessagePackData):MP.MessagePackData|Error =>
 MP.encode(Date.now())
