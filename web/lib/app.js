const Koa = require('koa');
const http = require('http');
const shutdown = require('koa-graceful-shutdown');
const koaBunyanLogger = require('koa-bunyan-logger');

const middlewares = require('./middlewares');
const container = require('./container');
const routes = require('./routes');

const { logger, tracer } = container.cradle;

const app = new Koa();
const server = http.createServer(app.callback());

app.use(middlewares.errorHandler);
app.use(shutdown(server));
app.use(middlewares.scopeContainer(container));
app.use(middlewares.scopeAxios(tracer));
app.use(koaBunyanLogger(logger));
app.use(middlewares.attachTraceID);
app.use(middlewares.attachUserID);
app.use(koaBunyanLogger.requestIdContext());
app.use(
  koaBunyanLogger.requestLogger({
    ignorePath: ['/ping'],
  }),
);

routes(app);

app.listen = server.listen.bind(server);

module.exports = app;
