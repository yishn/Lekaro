const path = require('path')

module.exports = (env, argv) => ({
  entry: './service/main.js',

  output: {
    filename: 'service.js',
    path: path.join(__dirname, 'dist')
  },

  devtool: argv.mode === 'production' ? false : 'cheap-module-eval-source-map',
  target: 'node'
})
