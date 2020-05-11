const { createContainer, Lifetime, asValue, asFunction } = require('awilix');

const config = require('./config');
const logger = require('./infra/logger');
const tracer = require('./infra/tracer');

const container = createContainer();
container.register({
  config: asValue(config),
  logger: asFunction(logger).singleton(),
  tracer: asFunction(tracer).singleton(),
  userID: asValue(''),
});

container.loadModules([
  [`${__dirname}/services/*(!(*.spec.js))`, Lifetime.SCOPED],
]);

module.exports = container;
