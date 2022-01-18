#!/usr/bin/env node

// This test script uses the `miniflare` cloudflare simulation library.
// This simulator is run on the local machine with a connected KV store
// named `BOOTSTRAP` just as a production cloudflare would.
// `npm test` can then proceed communicating with the local simulator
// for testing purposes.

const { spawn } = require('child_process')

let miniflare = null

/**
 * Cleanup the miniflare sub-process
 */
function cleanup() {
  if (miniflare) {
    miniflare.kill()
    console.log('[text-exec]: cleanup')
  }
}

/**
 * Execute `npm test` taking care to exit with an error code on failure
 */
function execTest(resolve, reject) {
  try {
    // spawn `npm test`
    const proc = spawn('npm', ['test'], {
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
}

/**
 * Start a miniflare sub-process, then run `npm test` as a sub-process.
 */
function main() {
  // make pathing easier, always relative to this script directory
  process.chdir(__dirname)

  // prep a promise for this function that can be handed to execTest later
  let resolve = null
  let reject = null
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })

  try {
    console.log('[test-exec]: spawning miniflare from', process.cwd())

    // spawn the miniflare process
    // note we need to call this sub-file directly,
    // rather than using ./node_modules/.bin/miniflare
    // because otherwise our kill command does not propagate down
    // and we end up creating zombie miniflare processes.
    miniflare = spawn(
      'node',
      [
        '--experimental-vm-modules',
        './node_modules/miniflare/dist/src/cli.js',
        '--kv',
        'BOOTSTRAP',
      ],
      {
        shell: false,
        stdio: 'pipe',
      },
    )

    // close the sub-process stdin
    miniflare.stdin.end()

    // set up events to handle exit conditions
    miniflare.stdout.on('data', (data) => {
      console.log(
        '[test-exec:STDOUT]:' +
          data.toString().replaceAll('\n', '\n[test-exec:STDOUT]:'),
      )

      // when the local server is listening, we can spawn the test
      if (data.toString().includes('- http://127.0.0.1:8787')) {
        console.log('[test-exec]: READY TO EXECUTE TEST')

        // hand off our promise resolve/reject to the test function
        execTest(resolve, reject)
      }
    })
    miniflare.stderr.on('data', (data) => {
      console.log(
        '[test-exec:STDERR]:' +
          data.toString().replaceAll('\n', '\n[test-exec:STDERR]:'),
      )
    })
    miniflare.on('close', (code) => {
      console.log('[test-exec]: miniflare closed', code)
      if (typeof code === 'number' && code === 0) {
        resolve()
      } else {
        reject(new Error('miniflare bad exit code: ' + code))
      }
    })
    miniflare.on('disconnect', () => {
      console.log('[test-exec]: miniflare disconnected')
      reject(new Error('miniflare disconnect'))
    })
    miniflare.on('exit', (code) => {
      console.log('[test-exec]: miniflare exited', code)
      if (typeof code === 'number' && code === 0) {
        resolve()
      } else {
        reject(new Error('miniflare bad exit code: ' + code))
      }
    })
    miniflare.on('error', (err) => {
      console.error('[test-exec]: miniflare errored', err)
      reject(err)
    })
  } catch (e) {
    reject(e)
  }

  return promise
}

// entrypoint
main().then(
  () => {
    cleanup()
    console.error('[test-exec]: done')
  },
  (err) => {
    cleanup()
    console.error('[test-exec]:', err)
    process.exitCode = 1
  },
)
