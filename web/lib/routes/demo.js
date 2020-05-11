const Router = require('koa-router');
const middlewares = require('../middlewares');

const router = new Router();

router.use(middlewares.responseHandler);

router.get('/halo', async (ctx) => {
  const { demoService } = ctx.scope.cradle;

  ctx.body = await demoService.halo(ctx.request.query);
});

router.get('/baidu', async (ctx) => {
  const { demoService } = ctx.scope.cradle;

  ctx.body = await demoService.getBaidu();
});

router.get('/error', (ctx) => {
  ctx.throw(403, 'forbidden');
});

module.exports = router;
