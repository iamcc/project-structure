const scopeAxios = require('./scopeAxios');
const tracer = require('../infra/tracer')({
  config: { tracer: { name: 'test' } },
});

it('axios should has tracer header', () => {
  const span = tracer.startSpan('test');
  const ctx = {
    header: {},
    scope: {
      register({ axios }) {
        expect(axios).toBeDefined();
        expect(axios.resolve()).toBeDefined();
        expect(axios.resolve().defaults.headers['x-b3-traceid']).toBe(
          span.context().toTraceId(),
        );
        expect(axios.resolve().defaults.headers['x-b3-parentspanid']).toBe(
          span.context().toSpanId(),
        );
      },
    },
  };
  const next = () => {};
  tracer.inject(span, ctx.header);
  scopeAxios(tracer)(ctx, next);
});
