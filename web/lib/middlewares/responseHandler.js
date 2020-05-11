const response = require('../infra/response');

module.exports = async (ctx, next) => {
  try {
    await next();

    ctx.body = response.success(ctx.body);
  } catch (e) {
    ctx.log.error(e);
    ctx.log.info(ctx.request.body, 'ctx.request.body');

    switch (e.name) {
      case 'ValidationError':
        ctx.body = response.failed(
          `ERR_PARAMS_${e.path}_${e.type}`.toUpperCase(),
          400,
        );
        break;
      default:
        ctx.body = response.failed(e.message, e.code || e.status || ctx.status);
    }

    ctx.status = 200;
  }
};
