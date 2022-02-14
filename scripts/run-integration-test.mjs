#!/usr/bin/env -S node --experimental-vm-modules

// vim: set syntax=javascript:

import { spawn } from 'child_process'
import { Miniflare, Log, LogLevel } from 'miniflare'

let server = null

async function main() {
  console.log('@@@@@-start')

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

  server = await mf.startServer()

  console.log('@@@@@-test')

  await execTest()

  console.log('@@@@@-done')
}

function execTest() {
  return new Promise((resolve, reject) => {
    try {
      const proc = spawn('./node_modules/.bin/ts-mocha', ['integration/integration.ts'], {
        shell: false,
        stdio: ['pipe', 'inherit', 'inherit'],
      })

      // close the sub-process stdin
      proc.stdin.end()

      // set up events to handle exit conditions
      proc.on('close', (code) => {
        console.log('[test-exec]: npm test closed', code)
        if (typeof code === 'number' && code === 0) {
          resolve()
        } else {
          reject(new Error('npm test bad exit code: ' + code))
        }
      })
      proc.on('disconnect', () => {
        console.log('[test-exec]: npm test disconnected')
        reject(new Error('npm test disconnect'))
      })
      proc.on('exit', (code) => {
        console.log('[test-exec]: npm test exited', code)
        if (typeof code === 'number' && code === 0) {
          resolve()
        } else {
          reject(new Error('npm test bad exit code: ' + code))
        }
      })
      proc.on('error', (err) => {
        console.error('[test-exec]: npm test errored', err)
        reject(err)
      })
    } catch (e) {
      reject(e)
    }
  })
}

// entrypoint
main().then(
  () => {
    if (server) {
      server.close()
    }
    console.error('[test-exec]: done')
  },
  (err) => {
    if (server) {
      server.close()
    }
    console.error('[test-exec]:', err)
    process.exitCode = 1
  },
)
