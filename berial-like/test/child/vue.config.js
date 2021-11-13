const path = require('path')
const { name } = require('./package')

module.exports = {
  publicPath: '/',
  devServer: {
    headers: { 'Access-Control-Allow-Origin': '*' },
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 3002,
    historyApiFallback: true,
    hot: true,
    disableHostCheck: true,
  },
}
