export class AgentInfoPacked {
 private value: Uint8Array
 constructor(value:Uint8Array) {
  this.value = Uint8Array.from(value)
 }

 encode():AgentInfoPacked.Encoded {
  return this.value
 }
}

export namespace AgentInfoPacked {
 export type Value = Uint8Array
 export type Encoded = Uint8Array

 export function decode(encoded:AgentInfoPacked.Encoded):AgentInfoPacked|Error {
  try {
   return new AgentInfoPacked(encoded)
  }
  catch (e) {
   return e
  }
 }
}
