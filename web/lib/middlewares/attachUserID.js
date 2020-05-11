module.exports = (ctx, next) => {
  ctx.state.userID = Math.random();
  ctx.log = ctx.log.child({ userID: ctx.state.userID });

  return next();
};
