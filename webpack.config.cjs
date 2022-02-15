// vim: set syntax=javascript:

const path = require('path')
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')

let mode = 'production'
let devtool = false
if (process.env.NODE_ENV === 'development') {
  mode = 'development'
  devtool = 'inline-source-map'
}

const wasmBuild = path.join(__dirname, 'rust', 'target', 'wasm-build')
const scripts = path.join(__dirname, 'scripts')

module.exports = {
  mode,
  devtool,
  target: 'web',
  output: {
    publicPath: './',
    module: true,
    filename: `worker.js`,
    path: path.join(__dirname, 'dist'),
    library: {
      type: 'module',
    },
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js'],
    plugins: [],
    fallback: { 'crypto': false },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.join(wasmBuild, 'holochain_bootstrap_wasm_bg.wasm'),
          to: 'holochain_bootstrap_wasm_bg.wasm',
        },
        {
          from: path.join(wasmBuild, 'holochain_bootstrap_wasm_bg.js'),
          to: 'holochain_bootstrap_wasm_bg.js',
        },
        {
          from: path.join(wasmBuild, 'holochain_bootstrap_wasm_export.js'),
          to: 'holochain_bootstrap_wasm_export.js',
        },
        {
          from: path.join(scripts, 'cf_worker_entry.js'),
          to: 'cf_worker_entry.js',
        },
      ],
    })
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          // transpileOnly is useful to skip typescript checks occasionally:
          // transpileOnly: true,
        },
      },
    ],
  },
  experiments: {
    outputModule: true,
  },
}
