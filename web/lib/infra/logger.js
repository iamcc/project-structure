const bunyan = require('bunyan');

module.exports = ({ config }) =>
  bunyan.createLogger({ serializers: bunyan.stdSerializers, ...config.log });
