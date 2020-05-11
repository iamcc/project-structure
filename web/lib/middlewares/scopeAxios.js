const { asValue } = require('awilix');
const axios = require('axios').default;

module.exports = (tracer) => (ctx, next) => {
  const span = tracer.startSpan(ctx.path, {
    childOf: tracer.extract(ctx.header),
  });
  const headers = {};
  tracer.inject(span, headers);

  ctx.scope.register({
    axios: asValue(axios.create({ headers })),
  });

  return next();
};
