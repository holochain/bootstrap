#!/usr/bin/env node

// vim: set syntax=javascript:

// this logic is base loosely on cloudflare's worker-build tool
// https://github.com/cloudflare/workers-rs/blob/main/worker-build/src/main.rs

const path = require('path')
const fs = require('fs')
const childProcess = require('child_process')

async function main () {
  await checkWasmPackInstalled()
  await wasmPackBuild()
  await cleanBuildDir()
  await writeExportWasm()
  await replaceGeneratedImportWithCustomImpl()
}

async function execCmd (cmd, cwd) {
  cwd = cwd || process.cwd()
  console.log('[rbw:exec]:', cmd)
  childProcess.execSync(cmd, {
    cwd,
    shell: false,
    stdio: ['ignore', 'inherit', 'inherit'],
  })
}

async function checkWasmPackInstalled () {
  console.log('[rbw:checkWasmPackInstalled]')
  try {
    await execCmd('wasm-pack --version')
  } catch (_err) {
    await execCmd('cargo install wasm-pack')
    await execCmd('wasm-pack --version')
  }
}

async function wasmPackBuild () {
  const crate = path.resolve('.', 'rust', 'holochain_bootstrap_wasm')
  const buildDir = path.resolve('.', 'rust', 'target', 'wasm-build')
  console.log('[rbw:wasmPackBuild]')
  if (process.env.NODE_ENV === 'development') {
    await execCmd(`wasm-pack build --dev --no-typescript --out-dir ${buildDir} --out-name holochain_bootstrap_wasm`, crate)
  } else {
    await execCmd(`wasm-pack build --release --no-typescript --out-dir ${buildDir} --out-name holochain_bootstrap_wasm`, crate)
  }
}

async function cleanBuildDir () {
  console.log('[rbw:cleanBuildDir]')
  const buildDir = path.resolve('.', 'rust', 'target', 'wasm-build')
  fs.unlinkSync(path.resolve(buildDir, '.gitignore'))
  fs.unlinkSync(path.resolve(buildDir, 'package.json'))
  //fs.unlinkSync(path.resolve(buildDir, 'README.md'))
  fs.unlinkSync(path.resolve(buildDir, 'holochain_bootstrap_wasm.js'))
}

async function writeExportWasm () {
  console.log('[rbw:writeExportWasm]')
  const fn = path.resolve('.', 'rust', 'target', 'wasm-build', 'holochain_bootstrap_wasm_export.js')
  fs.writeFileSync(fn, `
import * as rust_to_wasm from "./holochain_bootstrap_wasm_bg.js";
import _wasm from "./holochain_bootstrap_wasm_bg.wasm";

const _wasm_memory = new WebAssembly.Memory({initial: 512})
const _imports_obj = {
  env: { memory: _wasm_memory },
  './holochain_bootstrap_wasm_bg.js': rust_to_wasm,
}
export default new WebAssembly.Instance(_wasm, _imports_obj).exports
`)
}

async function replaceGeneratedImportWithCustomImpl () {
  console.log('[rbw:replaceGeneratedImportWithCustomImpl]')
  const fn = path.resolve('.', 'rust', 'target', 'wasm-build', 'holochain_bootstrap_wasm_bg.js')
  const data = fs.readFileSync(fn).toString()
  const customData = data.replace(
    `let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}`,
    "import wasm from './holochain_bootstrap_wasm_export.js';",
  )
    + "\nimport * as myself from './holochain_bootstrap_wasm_bg.js';"
    + "\nexport default myself;"
    + "\n"
  fs.unlinkSync(fn)
  fs.writeFileSync(fn, customData)
}

main().then(() => {
  console.log('[rbw:done]')
}, (err) => {
  console.error(err)
  process.exit(1)
})
