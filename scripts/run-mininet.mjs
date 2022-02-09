#!/usr/bin/env -S node --experimental-vm-modules

// vim: set syntax=javascript:

import { Miniflare, Log, LogLevel } from 'miniflare'

async function main() {
  const mf = new Miniflare({
    log: new Log(LogLevel.INFO),
    kvNamespaces: ['BOOTSTRAP'],
    wranglerConfigPath: true,
    wranglerConfigEnv: 'local',
    host: '127.0.0.1',
    port: 8787
  })

  const ns = await mf.getKVNamespace('BOOTSTRAP')
  await ns.put('proxy_pool:https://test.holo.host/this/is/a/test?noodle=true', '1')
  await ns.put('proxy_pool:https://test2.holo.host/another/test/this/is?a=b#yada', '1')

  const server = await mf.startServer()

  await new Promise(() => {})
}

// entrypoint
main().then(
  () => {
    console.error('[test-exec]: done')
  },
  (err) => {
    console.error('[test-exec]:', err)
    process.exitCode = 1
  },
)
