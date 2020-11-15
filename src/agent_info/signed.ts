import * as Kitsune from '../kitsune/kitsune'
import { AgentInfo, AgentInfoSafe } from './info'
import * as Crypto from '../crypto/crypto'
import * as MP from '../msgpack/msgpack'
import * as D from "io-ts/Decoder"
import { pipe } from 'fp-ts/lib/pipeable'
import { Uint8ArrayDecoder } from '../io/io'
import * as E from 'fp-ts/lib/Either'
import * as _ from 'lodash'

export const AgentInfoSignedRaw = D.type({
 agent: Kitsune.Agent,
 signature: Kitsune.Signature,
 agent_info: MP.messagePackData,
})
export type AgentInfoSignedRaw = D.TypeOf<typeof AgentInfoSignedRaw>

export const AgentInfoSignedRawSafe: D.Decoder<MP.MessagePackData, AgentInfoSignedRaw> = {
 decode: (a:MP.MessagePackData) => {
  return pipe(
   Uint8ArrayDecoder.decode(a),
   E.chain(value => MP.messagePackDecoder.decode(value)),
   E.chain(value => AgentInfoSignedRaw.decode(value)),
   E.chain(agentInfoSignedRawValue => {
    // The signature must be valid for the agent's pubkey.
    if (Crypto.verify(
     agentInfoSignedRawValue.agent_info,
     agentInfoSignedRawValue.signature,
     Kitsune.toPublicKey(agentInfoSignedRawValue.agent),
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

export const AgentInfoSigned = D.type({
 signature: Kitsune.Signature,
 agent: Kitsune.Agent,
 agent_info: AgentInfo,
})
export type AgentInfoSigned = D.TypeOf<typeof AgentInfoSigned>

export const AgentInfoSignedSafe: D.Decoder<MP.MessagePackData, AgentInfoSigned> = {
 decode: (a:MP.MessagePackData) => {
  return pipe(
   AgentInfoSignedRawSafe.decode(a),
   E.fold(
    errors => D.failure(a, JSON.stringify(errors)),
    agentInfoSignedRawSafeValue => pipe(
     AgentInfoSafe.decode(agentInfoSignedRawSafeValue.agent_info),
     E.fold(
      errors => D.failure(a, JSON.stringify(errors)),
      agentInfoValue => {
       // The inner and outer agent bytes need to be the same.
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
