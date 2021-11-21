const packageName = require('./package.json').name

module.exports = {
  webpack: function (config, ev) {
    config.output = {
      ...config.output,
      library: packageName,
      libraryTarget: 'umd',
      umdNamedDefine: true,
      publicPath: 'http://localhost:3333/',
    }
    return config
  },
  devServer: function (configFn) {
    return function (proxy, allowedHost) {
      const config = configFn(proxy, allowedHost)
      config.headers = {
        'Access-Control-Allow-Methods':
          'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers':
          'X-Requested-With, content-type, Authorization',
        'Access-Control-Allow-Origin': '*',
      }
      return config
    }
  },
}
