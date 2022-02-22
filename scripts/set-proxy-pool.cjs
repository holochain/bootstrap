#!/usr/bin/env node

// vim: set syntax=javascript:

const { execSync } = require('child_process')

function wrangler(env, args) {
  for (let i = 0; i < args.length; ++i) {
    args[i] = "'" + args[i] + "'"
  }
  args.push('--binding')
  args.push("'BOOTSTRAP'")
  args.unshift("'" + env + "'")
  args.unshift('-e')
  args.unshift("'./node_modules/.bin/wrangler'")
  args.unshift('node')

  const cmd = args.join(' ')
  console.log(cmd)
  return execSync(cmd, {
    shell: false,
    encoding: 'utf8',
  })
}

async function main () {
  const env = process.argv[2]
  const list = JSON.parse(wrangler(env, ['kv:key', 'list']))
  for (const item of list) {
    if (item.name.startsWith('proxy_pool:')) {
      console.log(wrangler(env, ['kv:key', 'delete', '-f', item.name]))
    }
  }
  for (const poolItem of process.argv.slice(3)) {
    console.log(wrangler(env, ['kv:key', 'put', 'proxy_pool:' + poolItem, '1']))
  }
}

main().then(() => {}, err => {
  console.error(err)
  process.exit(1)
})
