module.exports = async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    ctx.log.info(ctx.request.body, 'ctx.request.body');

    ctx.throw(e);
  }
};
