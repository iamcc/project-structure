# Web 项目结构

## 目录

```text
├── README.md
├── app // 前端（vue-cli init webpack）
│   └── mobile  // 手机端
│       ├── README.md
│   └── web     // PC端
│       ├── README.md
│       ├── build
│       ├── config
│       ├── src
│       │   ├── assets
│       │   ├── components
│       │   └── router
│       ├── static
│       └── test
│           └── unit
│               └── specs
├── index.js    // 项目入口文件
└── lib // 后端
│   ├── app.js
│   ├── config      // 配置
│   │   └── index.js
│   ├── container.js
│   ├── infra       // 基础组建
│   │   ├── logger.js
│   │   ├── response.js
│   │   └── tracer.js
│   ├── middlewares // 中间件
│   │   ├── attachTraceID.js
│   │   ├── attachUserID.js
│   │   ├── errorHandler.js
│   │   ├── index.js
│   │   ├── responseHandler.js
│   │   ├── scopeAxios.js
│   │   ├── scopeAxios.spec.js
│   │   └── scopeContainer.js
│   ├── routes      // 路由
│   │   ├── demo.js
│   │   ├── demo.test.js
│   │   └── index.js
│   └── services    // 服务调用
│       ├── demoService.js
│       └── demoService.spec.js
├── package-lock.json
├── package.json
└── yarn.lock
```

## 基础框架

| 名称          | 说明         |
| ------------- | ------------ |
| koa           | web 框架     |
| awilix        | 依赖注入框架 |
| axios         | http 请求库  |
| bunyan        | 日志库       |
| jaeger-client | 链路追踪     |
| yup           | 参数校验     |

## 开发框架

| 名称     | 说明         |
| -------- | ------------ |
| eslint   | 代码风格检测 |
| prettier | 代码格式化   |
| jest     | 单元测试     |

## 为什么引入 awilix 依赖注入

- 自动处理依赖关系
- 避免循环引用
- 自动管理生命周期
- 集中管理组建
- 更容易于做单元测试

## 启动流程说明

### index.js

```javascript
const container = require('./lib/container'); // 依赖注入容器
const app = require('./lib/app');

// 没有使用依赖注入的做法
// const config = require('./lib/config);
// const logger = require('./lib/infra/logger);
const { config, logger } = container.cradle; // 所有注入内容都能从 cradle 获得

app.listen(config.server.port, () => {
  logger.info(`server listen http://127.0.0.1:${config.server.port}`);
});
```

### lib/conatiner.js

```javascript
const { createContainer, Lifetime, asValue, asFunction } = require('awilix');

const config = require('./config');
const logger = require('./infra/logger');
const tracer = require('./infra/tracer');

const container = createContainer(); // 创建容器
container.register({
  config: asValue(config), // 注入 config
  logger: asFunction(logger).singleton(), // 注入 logger，使用单例模式
  tracer: asFunction(tracer).singleton(), // 注入 tracer，使用单例模式
  userID: asValue(''), // 注入 userID，后续解释
});

// 自动加载 services，使用单例模式
container.loadModules([
  [`${__dirname}/services/*(!(*.spec.js))`, Lifetime.SCOPED],
]);

module.exports = container;
```

### lib/app.js

```javascript
const Koa = require('koa');
const http = require('http');
const shutdown = require('koa-graceful-shutdown'); // 服务优雅退出
const koaBunyanLogger = require('koa-bunyan-logger');

const middlewares = require('./middlewares'); // 中间件
const container = require('./container'); // 容器
const routes = require('./routes'); // 路由

const { logger, tracer } = container.cradle;

const app = new Koa();
const server = http.createServer(app.callback());

app.use(middlewares.errorHandler); // 统一错误处理
app.use(shutdown(server)); // 服务优雅退出
app.use(middlewares.scopeContainer(container)); // 为每个请求注入一个 scopeContainer，独立生命周期（例如：requestID）
app.use(middlewares.scopeAxios(tracer)); // 为每个请求注入一个 axios 实例，自动传递 tracer header
app.use(koaBunyanLogger(logger));
app.use(middlewares.attachTraceID); // ctx.log 添加追踪信息
app.use(middlewares.attachUserID); // ctx.log 添加 userID
app.use(koaBunyanLogger.requestIdContext());
app.use(
  koaBunyanLogger.requestLogger({
    ignorePath: ['/ping'],
  }),
);

routes(app); // 配置路由

app.listen = server.listen.bind(server);

module.exports = app;
```

## lib/middlewares/scopeContainer.js

```javascript
module.exports = (container) => (ctx, next) => {
  ctx.scope = container.createScope(); // 创建 scopeContainer
  // 为什么需要 scopeContainer
  // 每个请求独立的生命周期，有独立的requestID，traceID，userID，axios等

  return next();
};
```

## lib/middlewares/scopeAxios.js

```javascript
const { asValue } = require('awilix');
const axios = require('axios').default;

module.exports = (tracer) => (ctx, next) => {
  const span = tracer.startSpan(ctx.path, {
    childOf: tracer.extract(ctx.header),
  }); // 创建子 span
  const headers = {};
  tracer.inject(span, headers); // 注入 header

  ctx.scope.register({
    axios: asValue(axios.create({ headers })), // 注入 axios 到 scopeContainer
  });

  return next();
};
```

## lib/middlewares/attachTraceID.js

```javascript
module.exports = (ctx, next) => {
  const { tracer } = ctx.scope.cradle; // 容器中获取 tracer
  let span = tracer.extract(ctx.header); // 获取 span
  // span 为空
  if (!span || !span.toTraceId()) {
    span = tracer.startSpan(ctx.path).context(); // 创建新的 span
  }

  ctx.log = ctx.log.child({ span: span.toString() }); // 添加 span 字段

  // ctx.log.info(...)
  // --> { ..., span: xxxx }

  return next();
};
```

## lib/middlewares/attachUserID.js

```javascript
module.exports = (ctx, next) => {
  ctx.state.userID = Math.random(); // 从 session、cookie、jwt 中解析获得 userID
  ctx.log = ctx.log.child({ userID: ctx.state.userID }); // 注入 log

  // ctx.log.info(...)
  // --> { ..., userID: xxxx }

  return next();
};
```

> 还可以根据需求注入订单 ID 等信息，方便排查问题

## lib/services/demoService.js

```javascript
const { object, string } = require('yup');

// 入参校验
const haloInputSchema = object({ name: string().required().min(2) });

// 自动注入 userID，axios
module.exports = function makeDemoService({ userID, axios }) {
  /**
   *
   * @param {{
   *  name: string,
   * }} params
   */
  const halo = async (params) => {
    const { name } = await haloInputSchema.validate(params); // 校验参数，校验失败直接 throw ValidationError

    return `halo ${name}! - ${userID}`;
  };

  const getBaidu = async () => {
    const res = await axios.get('http://baidu.com');

    return res.data;
  };

  return {
    halo,
    getBaidu,
  };
};
```

## lib/routes/demo.js

```javascript
const Router = require('koa-router');
const middlewares = require('../middlewares');

const router = new Router();

router.use(middlewares.responseHandler); // 自动处理返回数据格式 {error_code, error_msg, data}

router.get('/halo', async (ctx) => {
  const { demoService } = ctx.scope.cradle; // 从 scopeContainer 中获取 demoService

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
```

没有用依赖注入的做法或手动做依赖注入的做法

```javascript
// 伪代码
const Axios = require('axios').default;
const tracer = require('./lib/infra/tracer');
const makeDemoService = require('./lib/services/demoService);

router.get('/halo', async (ctx) => {
  const userID = ctx.state.userID;
  const axios = Axios.create({});
  const span = tracer.startSpan(ctx.path, {
    childOf: parentSpan,
  });
  tracer.inject(span, axios.defaults.headers);
  const demoService = makeDemoService({ userID, axios });

  ctx.body = await demoService.halo(ctx.request.query);
});
```

## 单元测试

### lib/services/demoService.spec.js

> 测试文件保持和元文件同一个目录，命名为`源文件.spec.js`

```javascript
const makeDemoService = require('./demoService');

it('call halo should be ok', async () => {
  const userID = Math.random();
  const name = Math.random();
  const demoService = makeDemoService({ userID }); // 借助于依赖注入的能力，非常方便的 mock 服务
  const ret = await demoService.halo({ name });

  expect(ret).toBe(`halo ${name}! - ${userID}`);
});
```

### lib/routes/demo.spec.js

```javascript
const Koa = require('koa');
const supertest = require('supertest');

const router = require('./demo');
const makeDemoService = require('../services/demoService');
const response = require('../infra/response');

const app = new Koa();
const userID = 'fake-user-id'; // mock userID

app.use((ctx, next) => {
  ctx.log = { info() {}, error() {} }; // mock logger
  ctx.scope = {
    cradle: {
      demoService: makeDemoService({ userID }), // mock demoService
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
```
