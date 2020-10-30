import * as Kitsune from '../kitsune/kitsune'
import { agentInfo, agentInfoSafe } from './info'
import { Ed25519 } from '../crypto/crypto'
import { MessagePackData, messagePackDecoder, messagePackData } from '../msgpack/msgpack'
import * as D from "io-ts/Decoder"
import { pipe } from 'fp-ts/lib/pipeable'
import { Uint8ArrayDecoder } from '../io/io'
import * as E from 'fp-ts/lib/Either'
import * as _ from 'lodash'

export const agentInfoSignedRaw = D.type({
 signature: Kitsune.Signature,
 agent: Kitsune.Agent,
 agent_info: messagePackData,
})
export type AgentInfoSignedRaw = D.TypeOf<typeof agentInfoSignedRaw>

export const agentInfoSignedRawSafe: D.Decoder<MessagePackData, AgentInfoSignedRaw> = {
 decode: (a:MessagePackData) => {
  return pipe(
   Uint8ArrayDecoder.decode(a),
   E.chain(value => messagePackDecoder.decode(value)),
   E.chain(value => agentInfoSignedRaw.decode(value)),
   E.chain(agentInfoSignedRawValue => {
    if (Ed25519.verify(
     agentInfoSignedRawValue.agent_info,
     agentInfoSignedRawValue.signature,
     Kitsune.toBytes(agentInfoSignedRawValue.agent),
    )) {
     return D.success(agentInfoSignedRawValue)
    }
    else {
     return D.failure(a, 'Signature does not verify for agent and agent_info data.')
    }
   })
  )
 }
}

export const agentInfoSigned = D.type({
 signature: Kitsune.Signature,
 agent: Kitsune.Agent,
 agent_info: agentInfo,
})
export type AgentInfoSigned = D.TypeOf<typeof agentInfoSigned>

export const agentInfoSignedSafe: D.Decoder<MessagePackData, AgentInfoSigned> = {
 decode: (a:MessagePackData) => {
  return pipe(
   agentInfoSignedRawSafe.decode(a),
   E.fold(
    errors => D.failure(a, JSON.stringify(errors)),
    agentInfoSignedRawSafeValue => pipe(
     agentInfoSafe.decode(agentInfoSignedRawSafeValue.agent_info),
     E.fold(
      errors => D.failure(a, JSON.stringify(errors)),
      agentInfoValue => {
       if ( ! _.isEqual(agentInfoSignedRawSafeValue.agent, agentInfoValue.agent) ) {
        return D.failure(a, `Outer signed agent ${agentInfoSignedRawSafeValue.agent} does not match signed inner agent ${agentInfoValue.agent}.`)
       }

       return D.success({
        signature: agentInfoSignedRawSafeValue.signature,
        agent: agentInfoSignedRawSafeValue.agent,
        agent_info: agentInfoValue,
       })
      }
     )
    )
   )
  )
 }
}
