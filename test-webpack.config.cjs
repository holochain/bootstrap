// vim: set syntax=javascript:

const path = require('path')
const webpack = require('webpack')

let mode = 'development'
let devtool = 'inline-source-map'

module.exports = {
  mode,
  devtool,
  target: 'node',
  entry: './integration/integration.ts',
  output: {
    publicPath: './',
    filename: `integration.cjs`,
    path: path.join(__dirname, 'test-dist'),
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js'],
    plugins: [],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          // transpileOnly is useful to skip typescript checks occasionally:
          transpileOnly: true,
        },
      },
    ],
  },
}
