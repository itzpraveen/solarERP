const webpack = require('webpack'); // Keep require for now
const path = require('path');

module.exports = function override(config, _env) {
  // Add underscore to env
  // Add fallbacks for Node.js core modules
  // eslint-disable-next-line no-param-reassign
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    zlib: require.resolve('browserify-zlib'),
    util: require.resolve('util/'),
    assert: require.resolve('assert/'),
    url: require.resolve('url/'),
    os: require.resolve('os-browserify/browser'),
    buffer: require.resolve('buffer/'),
    process: require.resolve('process/browser.js'),
    path: false,
    fs: false,
  };
  // Alias shared common folder for TS imports
  config.resolve.alias = { ...(config.resolve.alias || {}), solarerp: path.resolve(__dirname, '../common') };

  // Add webpack plugins
  // Add webpack plugins
  // eslint-disable-next-line no-param-reassign
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
  ];

  return config;
};
