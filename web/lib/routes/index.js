const Router = require('koa-router');
const glob = require('glob');
const { asValue } = require('awilix');

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
    router.use(subRouter.name, subRouter.routes());
  });

  app.use(router.routes(), router.allowedMethods());
};
