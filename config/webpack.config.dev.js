const webpackConfigBase = require('./webpack.config.base')
const { merge } = require('webpack-merge')

const webpackConfig = merge(webpackConfigBase, {
  mode: 'development',
  devtool: 'eval-source-map', // 方便调试
  stats: { children: false }
})

module.exports = webpackConfig
