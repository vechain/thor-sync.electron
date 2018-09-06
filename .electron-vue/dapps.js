const path = require('path')
const fs = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const dappsPath = path.join(__dirname, '../src/dapps')

const dapps = fs.readdirSync(dappsPath)

function getDappsEntries (dapps) {
  let result = {
    entries: {},
    plugins: []
  }
  dapps.forEach(item => {
    result.entries[item] = path.join(dappsPath, item, 'main.ts')
    result.plugins.push(getHtmlPlugin(item))
  })
  return result
}

function getHtmlPlugin (dapp) {
  console.log(process.env.NODE_ENV)
  if (process.env.NODE_ENV === 'production') {
    return new HtmlWebpackPlugin({
      title: dapp,
      filename: `${dapp}.html`,
      inject: true,
      template: path.resolve(__dirname, '../src/dapp.ejs'),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true
      },
      nodeModules: process.env.NODE_ENV !== 'production'
        ? path.resolve(__dirname, '../node_modules')
        : false,
      chunks: ['manifest', 'vendor', dapp],
      nodeModules: false
    })
  } else {
    return new HtmlWebpackPlugin({
      title: dapp,
      filename: `${dapp}.html`,
      inject: true,
      chunks: [dapp],
      template: path.resolve(__dirname, '../src/dapp.ejs')
    })
  }
}

const DApps = getDappsEntries(dapps)

module.exports = DApps
