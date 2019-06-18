const path = require('path')

module.exports = (env, argv) => ({
  entry: './server/main.js',

  output: {
    filename: 'server.js',
    path: path.join(__dirname, 'build')
  },

  devtool: argv.mode === 'production' ? false : 'cheap-module-eval-source-map',
  target: 'node',

  node: {
    __dirname: false
  },

  externals: {
    express: 'require("express")'
  }
})
