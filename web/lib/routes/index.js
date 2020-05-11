const Router = require('koa-router');
const glob = require('glob');
const path = require('path');
const { asValue } = require('awilix');
const demo = require('./demo');

module.exports = (app) => {
  const router = new Router();

  router.use((ctx, next) => {
    ctx.scope.register({
      userID: asValue(ctx.state.userID),
    });

    return next();
  });

  glob.sync(`${__dirname}/*(!(index.js|*.spec.js))`).forEach((file) => {
    // eslint-disable-next-line
    const subRouter = require(file);
    const subRouteName = path.basename(file).slice(0, -3);
    router.use(`/${subRouteName}`, subRouter.routes());
  });

  app.use(router.routes(), router.allowedMethods());
};
