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

module.exports = {
  mode,
  devtool,
  output: {
    publicPath: './',
    module: true,
    filename: `worker.js`,
    path: path.join(__dirname, 'dist'),
    library: {
      type: 'module',
    },
    environment: {
      module: true,
      dynamicImport: true,
    },
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js'],
    plugins: [],
  },
  externals: [
    function ({ context, request }, callback) {
      if (request.endsWith('/holochain_bootstrap_wasm_bg.wasm')) {
        return callback(null, './holochain_bootstrap_wasm_bg.wasm', 'module')
      } else if (request.endsWith('/holochain_bootstrap_wasm_bg.js')) {
        return callback(null, './holochain_bootstrap_wasm_bg.js', 'module')
      } else if (request.endsWith('/holochain_bootstrap_wasm_export.js')) {
        return callback(null, './holochain_bootstrap_wasm_export.js', 'module')
      } else {
        return callback()
      }
    },
  ],
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
