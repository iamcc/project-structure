const container = require('./lib/container');
const app = require('./lib/app');

const { config, logger } = container.cradle;

app.listen(config.server.port, () => {
  logger.info(`server listen http://127.0.0.1:${config.server.port}`);
});
