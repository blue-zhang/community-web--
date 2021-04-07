const path = require('path')
// externals选项中，配置不打包node_modules
const nodeExternals = require('webpack-node-externals')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const webpack = require('webpack')
const utils = require('./utils')

const config = {
  target: 'node',
  mode: 'development',
  entry: {
    main: path.join(utils.APP_PATH, 'index.js') // main 是打包后的文件名
  },
  output: {
    filename: '[name].bundle.js',
    path: path.join(utils.DIST_PATH)
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, '../src')
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: [{ loader: 'babel-loader' }],
        exclude: [path.join(__dirname, '/node_modules')]
      }
    ]
  },
  // 排除打包文件 ???????
  externals: [nodeExternals()],
  plugins: [
    new CleanWebpackPlugin(),
    // 要写成'"development"'形式
    // Note that because the plugin does a direct text replacement,
    // the value given to it must include actual quotes inside of the string itself.
    // Typically, this is done either with alternate quotes, such as '"production"',
    // or by using JSON.stringify('production').
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV:
          process.env.NODE_ENV === 'production' ||
          process.env.NODE_ENV === 'prod'
            ? '"production"'
            : '"development"'
      }
    })
  ],
  node: {
    console: true,
    global: true,
    process: true,
    Buffer: true,
    __filename: true,
    __dirname: true,
    setImmediate: true,
    path: true
  }
}

module.exports = config
