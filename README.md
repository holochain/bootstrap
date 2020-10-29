# bootstrap

This is a [CloudFlare Worker](https://workers.cloudflare.com/) that allows
holochain networks to bootstrap.

## Installing

The worker code is all written in typescript using npm.

Tested on CI against node major versions `12` and `14` on ubuntu.

Standard `npm install` to install.

Running tests is `npm test` _but requires a running `wrangler dev`._

Wrangler can be installed with npm globally as `npm i -g @cloudflare/wrangler`
but this is simply wrapping a rust binary that can be compiled and installed
directly with `cargo install wrangler`. I fould the latter can be more reliable
if you're seeing issues like segfaults with the npm approach.

If you're using nix there is a `shell.nix` that provides relevant `npm`,
`cargo`, and `rustc`, with a shell hook to install npm and wrangler into the
repository (not globally).

## Forking

We expect and encourage developers to fork and use this code for deployment on
their own CloudFlare account.

Simply update the `wrangler.toml` with your DF account details and ensure that
github secrets have `CF_API_TOKEN` set for production deployment.

## Why do holochain networks need a bootstrap service?

tl;dr: to mitigate eclipse attacks.

Holochain is commonly discussed in terms of 'the DHT' (Distributed Hash Table).

Data is distributed across all the nodes on 'the network' and validated by a
deterministic but random (based on cryptographic hash) set of nodes according to
a set of rules (defined in wasm) implemented as callback functions.

All of that happens in [the 'conductor'](https://github.com/holochain/holochain).

Nodes send data to each other to maintain 'the DHT' without central servers.

Basic DHT behaviour includes (for example):

- Redundant data storage and healing as nodes join and leave the network
- Identifying and mitigating bad actors
- Direct p2p realtime communications and RPC style wasm calls

Being more specific there are _two_ DHTs.

One DHT tracks the signed (by the node) ephemeral network locations of nodes in
parallel to the 'main DHT' that handles all the holochain data and validation.

We can call this the 'agent DHT', it is much simpler:

- The rules for agent data validation is hardcoded into the networking layer
- It only tracks agent IDs (pubkeys) and spaces (DHT/DNA hashes)
- It requires agents to pass a challenge to participate

Unlike the data DHT, where there may be many TBs of data in a large, active DHT,
the agent info is relatively small and each agent can only broadcast a single
agent info data point per space.

It's expected that each agent can hold a significantly higher percentage of the
agent DHT data than a typical data DHT. Any agent lookup can often be completed
in zero or not many hops.

The agent's signature of their current network location is returned alongside
their information and validated. Malicious actors on the network cannot tamper
with another agent's location, the worst they can do is withold another agent's
location, but as long as at least one honest agent is returning the signed agent
location, that agent is discoverable.

At this point we still have two big, obvious problems:

- How do we handle firewalls etc.?
- How does a new node safely find an honest node in the first place?

The solution to the first problem is handled via. the holochain _proxy_ and is
totally different and separate to the _bootstrap_ service.

The _proxy_ allows nodes that are already aware of each other indirectly to open
connections to each other directly, regardless of firewalls, etc.

The _bootstrap_ service allows nodes to advertise their current network location
_independant of the agent DHT_.

For example, this repository implements a bootstrap service as:

- A simple POST based API that accepts signed agent info
- A CloudFlare backed key/value store
- Agent information automaticaly expires (is deleted) after 10 minutes
- The service can be forked/copied by any hApp developer and deployed to their
  own CloudFlare account
- 'Trusted' agent public keys can be set by the service owner to further
  mitigate eclipse attacks at the expense of needing to maintain high(ish)
  availability nodes (not implemented yet)

This allows nodes that want to safely join a DHT space to prepopulate their
agent locations with everyone advertising themselves within the last 10 minutes.

## Limitations of the boostrap service

There are some obvious limits of the bootstrap service as currently implemented.

Some of these limitations can be mitigated relatively easily and others need
more effort or domain specific solutions.

### Sybil ghost network

It's pretty easy for someone to spam the kv store with apparently valid data
that has been signed by a garbage keypair and doesn't lead anywhere.

This would create a ghost network where so few listed agents are real that a new
user cannot open any useful connections.

It also puts pressure on the server, which in this case is CloudFlare so I'm
sure they can handle it, but it may result in additional costs for the account
owner.

Mitigations:

- Trust and delegated trust model (need to be a dev or approved by a dev)
- Identiy/auth based challenge (e.g. DPKI)
- Anti-spam/throttling challenges (e.g. proof of work)
- Proof of unique human (e.g. QR code systems like bright ID)

Anything that meaningfully raises the bar for entry above 'can sign data' is
useful mitigation here.

At the time of writing we are simply expiring all key/value pairs after 10
minutes, which is a relatively weak challenge but at least sybils will fade
quickly unless there is a dedicated machine somewhere actively generating them
over a long period of time.

Additionally, CloudFlare themselves implement anti-bot protections at the
network layer that we passively benefit from simply by using their service.

### Eclipse attack

Similar to the ghost town situation, a more sophisticated attack generates a
large number of agents that do resolve to a real connection.

The real but malicious connections 'fork' new users off onto a parallel set of
DHTs. The sheer number of fake accounts defeats the bootstrap service as a means
to avoid eclipse attacks because some percentage of new users will never find an
honest signal among the malicious noise.

For an arbitrarily sophisticated sybil we can't hope to automatically detect
them at the bootstrap service level with an algorithm.

At some point an element of trust will need to be applied to the bootstrapping
process.

Even monero, a world class privacy and trust minimised blockchain, relies on a
website [Monero World](https://moneroworld.com/#nodes) to list out some trusted
nodes that can bootstrap new users onto the monero network safely. This relies
on users finding the list when they start their wallet, and downloading a safe
wallet in the first place, and trusting the developers that write the monero
code, and the machine the user runs the code on... etc.

The best we can do is to allow for decentralisation so that no party can _force_
themselves to be 'trusted' and to implement an explicit trust model so that
agents can be vetted by each other.

This is similar to the [ERC-20 lists used by uniswap](https://tokenlists.org/),
there is a default list maintained by uniswap and then several dozen community
maintained lists. Users of uniswap then select which list they'd like to opt-in
to in order to be protected against phishing and other scams.

This bootstrap service currently has no concept of trust in it but it will in
the future.

The `random` endpoint _does_ enforce that random agents are returned from the
running service, so that a client cannot be tricked into selecting specific
agents from the listings. This puts additional trust on CloudFlare (see below).

With any trust model, there will be some set of public keys that agents would be
strongly encouraged to prioritise when joining a network.

These public keys would be set after some kind of elevated access challenge.
For example:

- Set directly in the CloudFlare interface by the account owner (developer)
- Requiring a signature from another already-trusted agent (delegation)
- Requiring a signature from some external system (identity)
- Some other challenge (algorithmic, API key, etc.)

So then the service owner sets the trust model, populates and maintains the
trusted public keys, then end-users opt in to a bootstrap service that they
decide to trust the operator and model of.

### DOS attack

CloudFlare themselves are one of the world leaders in mitigating DOS attacks for
their clients.

The logic in the workers is limited to simple cryptographic checks and direct
interactions with the CloudFlre kv store.

It's unlikely that an attacker could exploit something in this repository that
brings down the service for honest users. The worst they could do is trip the
10-50ms CPU circuit breaker on an individual request and see a 500 error for
themselves.

### Trusting CloudFlare

Of course, all this talk of explicit trust is ignoring the need to implicitly
trust CloudFlare as the infrastructure provider of the kv service.

Given that we're cryptographically signing absolutely everything, the damage
that CloudFlare can do is limited to witholding data or failing to provide their
service. They cannot tamper with or inject any additional data.

CloudFlare returns the original agent info bytes alongside the agent pubkey and
signature to all agents, so that every agent can independently verify the data.
Agents do not need to trust that CloudFlare has not tampered with the data
because they SHOULD do their own cryptographic verification of all data returned
from any boostrap service. This removes the tempation for an attacker to attempt
to hijack a bootstrap service to invisibly serve up bad network agent network
locations.

To mitigate the need to trust CloudFlare _in general_ we have a well defined and
very simple POST API that most web developers could be confident in implementing
correctly. This way they can build their own binaries and servers that are
compatible with the holochain conductors and host these anywhere.

The main concern is that the `random` op is opaque from the caller's point of
view and this is where CloudFlare could collude with (or be hacked by) an
attacker to "randomly" only return malicious nodes.

The additional ops `get` and `list` are provided so that extra paranoid agents
can implement their own randomness at the expense of additional network hops.

## API

### POST method

All API requests use the HTTP POST method.

This is for both gets and sets.

This is so that we can use messagepack binary data as-is for all requests and
responses with no 'extra steps' like handling base64 encoding/decoding and URL
parsing just to work with binary data.

### GET ping

There is _one_ GET endpoint, used for debugging, testing and health checks.

All GET requests to the bootstrap service will receive the response string `OK`
encoded as UTF-8 text data and the `200` status code.

The GET endpoint behaves differently to all other methods in that it is not
serialized, is not binary data, has no op headers and cannot interact with the
kv service at all.

### MessagePack serialization

All requests and responses are serialized as binary MessagePack data in the
body of the request/response.

The op header (see below) defines which operation the messagepack payload in a
request is dispatched to and what kind of response will be returned.

This is the same serialization format that holochain itself uses for wire
messages on the network and for compatibility with wasm for validation logic.

### Ed25519/NaCl crytography

All cryptographic logic is handled as per libsodium using the Ed25519 curve.

This is the same cryptography as holochain itself which means the signatures and
validation used by the bootstrap service are the same as those used by the agent
DHT by conductors.

This implementation uses [tweetnacl](https://www.npmjs.com/package/tweetnacl).

### Headers

The `Content-Type` header for all POST requests must be `application/octet` to
signify to the server that the body of the request is a binary payload.

The action to be performed is set by the `X-Op` header in the POST request.

The possible values are:

- `put`: store signed agent info
- `list`: list all stored agent info
- `get`: retrive a single agent info
- `random`: retrieve up to N random agents (hybrid of list and get)

## Data structures

### Agent info

`AgentInfoSigned` is the main data structure.

It is the same structure defined by `kitsune_p2p` in the Rust codebase for the
conductor, but ported to typescript for validation here.

It looks like this on the wire:

```typescript
{
 signature: Uint8Array,
 agent: Uint8Array,
 agent_info: Uint8Array,
}
```

Where the `agent_info` is messagepack serialized binary data that MUST be valid
for the `agent` public key and `signature` bytes according to libsodium.

If the `agent_info` is not valid then it MUST be discarded and any further logic
abandoned because this is ALWAYS malicious or corrupt data. The inner
`agent_info` MUST NOT be deserialized if it is invalid.

When the `agent_info` is validated and unpacked it looks like this:

```typescript
agent_info: {
 space: Uint8Array,
 agent: Uint8Array,
 urls: Array<string>,
 signed_at_ms: number,
}
```

- `space` is the bytes of the hash of the DNA used to connect to the DHT
- `agent` is the same as the signing key above and MUST match it
- `urls` is an array of strings that are the URLs the agent can be found at
- `signed_at_ms` is the unix millisecond timestamp of the signing

The `AgentInfoSigned` packed data is saved and retrieved by the bootstrap
service. We store exactly what is given to us by the agent alongside its
cryptographic integrity and authenticity proof (signature).

This allows all agents using the bootstrap service to redundantly verify the
data for themselves which is an important hedge against a compromised service.

### KV keys

Valid `AgentInfoSigned` data is stored under the binary concatenation of
`space` + `agent` in the CloudFlare kv store.

For example, if there was a space `[1, 2, 3]` and agent `[4, 5, 6]` the kv key
would be `[1, 2, 3, 4, 5, 6]`.

Technically CloudFlare kv does not support prefix based lookups (which we need)
for raw binary keys, so internally we base64 the space and agent separately
before concatenating them. This is an _internal implementation detail only_ so
any attempt to externally interact with keys as base64 data will fail because
the input/output will be treated as raw binary bytes, not utf8 encoded data.

This is more efficient on the wire and decouples the messagepack binary API
design from the CloudFlare key prefix lookup implementation.

For example, when performing a `get` op the POST body would contain the space
and agent key raw binary bytes, not a base64 or utf8 representation of these.

## Ops

### Put

Put a signed agent info into the kv store.

`X-Op` header: `put`

Request body: Messagepack serialized `AgentInfoSigned` data (see above).

Successful response: Messagepack encoded `null`, i.e. `[ 192 ]` binary body.

If the `AgentInfoSigned` data validates on the CloudFlare worker it will be
saved under the kv key (see above) for the parsed `space` and `agent`.

The value will expire (be deleted) 10 minutes after it is saved.

The expectation is that agents repost their current location at least once per
10 minutes to maintain liveness.

### List

List all current signed agent info.

`X-Op` header: `list`

Request body: Messagepack serialized `space` bytes.

Successful response: Messagepack serialized array of every `agent` pubkey
                     currently in the `space`. If there are no agents a
                     messagepack empty array, i.e. `[221, 0, 0, 0, 0]`.

There are no limits on the size of this list other than the limits imposed by
CloudFlare, e.g. for DOS mitigation.

It will paginate across all agent pubkeys internally, not just the default first
1000 keys limit internal to CloudFlare.

### Get

Get a specific `AgentInfoSigned` for a given kv key.

`X-Op` header: `get`

Request body: Messagepack serialized `space` + `agent` kv key bytes.

Successful response: Messagepack serialized `AgentInfoSigned` data.
                     The agent SHOULD verify the data redundantly themselves.
                     Messagepack `null` i.e. `[ 192 ]` if not found.

### Random

Get _up to_ `limit` random `AgentInfoSigned` for a given `space`.

`X-Op` header: `random`

Request body: Messagepack serialized `{ space: Uint8Array, limit: number }`.
              The `limit` must be a positive integer.

Successful response: Messagepack serialized array of `AgentInfoSigned` data.
                     If there are at least `limit` agents in the `space` then
                     there will always be `limit` random agents returned.
                     If there are less than `limit` agents in the `space` then
                     `limit` agents will be returned in random order.
                     If there are no agents a messagepack empty array,
                     i.e. `[221, 0, 0, 0, 0]`.

This is the default and recommended way for an agent to fetch node information
as it balances network efficiency against eclipse mitigation via randomness.

Agents are encouraged to fetch as many random agents as they can comfortably
handle to maximise the diversity of their view on the network before they
attempt to join, which has benefits beyond eclipse protection.

Paranoid agents can implement their own randomness using `get` and `list`.

## Validation

Validation rules are well defined for signed agent info and all other binary
data is fixed sized.

### SignedAgentInfo validation

Validation is a 'chained' operation in that each step of the validation will be
attempting to verify some aspect of the data. Any step that fails MUST abort the
entire validation chain as a failure to validate the data. That is to say, any
corrupt or bad data MUST immediately stop validations and return an error. The
error SHOULD be descriptive to aid logging and debugging.

0. The raw `SignedAgentInfo` on the wire will be a messagepacked object with
   keys `signature`, `agent`, and `agent_info` and binary array values.
1. Attempt to decode the messagepack data into the object.
2. Check that the `signature` is 64 bytes long, as per `Ed25519` signatures.
3. Check that the `agent` pubkey is 32 bytes long, as per `Ed25519` public keys.
4. Use `libsodium` to verify the `agent_info` bytes using the `signature` and
   `agent` pubkey, as per `Ed25519`.
5. IF the signature is valid, attempt to deserialize the `agent_info` bytes
   using messagepack to an `AgentInfo` object (see above).
6. Check the `space` is 32 bytes long, as per base HoloHash bytes.
7. Check the `agent` is 32 bytes long, as per `Ed25519` public keys.
8. Check the `agent` bytes are equal to the `agent` bytes used to verify the
   signature above.
9. Check the `urls` is an array of utf8 strings.
10. Check the `signed_at_ms` is a positive number.
11. Check the `signed_at_ms` is in the past relative to the bootstrap service's
    local time, interpreted as a unix timestamp in milliseconds.
