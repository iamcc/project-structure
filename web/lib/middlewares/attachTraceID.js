module.exports = (ctx, next) => {
  const { tracer } = ctx.scope.cradle;
  let span = tracer.extract(ctx.header);
  if (!span || !span.toTraceId()) {
    span = tracer.startSpan(ctx.path).context();
  }

  ctx.log = ctx.log.child({ span: span.toString() });

  return next();
};
