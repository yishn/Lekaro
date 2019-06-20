const path = require('path')

module.exports = (env, argv) => ({
  entry: './ui/main.js',

  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'static')
  },

  devtool: argv.mode === 'production' ? false : 'cheap-module-eval-source-map',
  target: 'web',

  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-react', {pragma: 'h'}]],
            plugins: [['@babel/plugin-proposal-class-properties', {loose: true}]]
          }
        }
      },
      {
        test: /\.svg$/,
        loader: 'react-svg-loader'
      }
    ]
  },

  resolve: {
    alias: {
      react: 'preact'
    }
  }
})
