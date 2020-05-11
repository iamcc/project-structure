const Koa = require('koa');
const supertest = require('supertest');

const router = require('./demo');
const makeDemoService = require('../services/demoService');
const response = require('../infra/response');

const app = new Koa();
const userID = 'fake-user-id';

app.use((ctx, next) => {
  ctx.log = { info() {}, error() {} };
  ctx.scope = {
    cradle: {
      demoService: makeDemoService({ userID }),
    },
  };

  return next();
});
app.use(router.prefix('/demo').routes());

it('get /demo/halo should get params required error', (done) => {
  supertest(app.callback())
    .get('/demo/halo')
    .expect(200)
    .expect(response.failed('ERR_PARAMS_NAME_REQUIRED', 400))
    .end(done);
});

it('get /demo/halo?name=c should get params min error', (done) => {
  supertest(app.callback())
    .get('/demo/halo?name=c')
    .expect(200)
    .expect(response.failed('ERR_PARAMS_NAME_MIN', 400))
    .end(done);
});

it('get /demo/halo?name=cc should be ok', (done) => {
  supertest(app.callback())
    .get('/demo/halo?name=cc')
    .expect(200)
    .expect(response.success(`halo cc! - ${userID}`))
    .end(done);
});
