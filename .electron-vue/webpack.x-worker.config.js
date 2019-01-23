'use strict'

const path = require('path')
const { dependencies } = require('../package.json')
const webpack = require('webpack')

const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

let xWorkerConfig = {
  entry: {
    'x-worker': path.join(__dirname, '../src/x-worker.ts')
  },
  externals: [
    ...Object.keys(dependencies || {})
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        enforce: 'pre',
        use: {
          loader: 'tslint-loader',
          options: {
            configFile: path.join(__dirname, '../tslint.json'),
            failOnHint: false
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            experimentalWatchApi: true
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      }
    ]
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production'
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist/electron')
  },
  plugins: [
    new HtmlWebpackPlugin({
        filename: 'x-worker.html',
        template: path.resolve(__dirname, '../src/x-worker.ejs'),
        minify: {
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeComments: true
        },
        nodeModules: process.env.NODE_ENV !== 'production'
          ? path.resolve(__dirname, '../node_modules')
          : false
      }),
    new webpack.NoEmitOnErrorsPlugin(),
    new ForkTsCheckerWebpackPlugin({
        vue: true
      })
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json', '.node'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: path.join(__dirname, '../tsconfig.json')
      })
    ]
  },
  target: 'electron-renderer'
}

/**
 * Adjust xWorkerConfig for development settings
 */
if (process.env.NODE_ENV !== 'production') {
    xWorkerConfig.plugins.push(
    new webpack.DefinePlugin({
      '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`
    })
  )
}

/**
 * Adjust xWorkerConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
    xWorkerConfig.plugins.push(
     new UglifyJsPlugin({
       include: /\.js$/g,
       uglifyOptions: {
        keep_fnames: true
       }
     }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    })
  )
}

module.exports = xWorkerConfig
