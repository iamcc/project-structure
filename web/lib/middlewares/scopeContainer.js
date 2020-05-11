module.exports = (container) => (ctx, next) => {
  ctx.scope = container.createScope();

  return next();
};
