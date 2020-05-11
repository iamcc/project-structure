const { initTracer, ZipkinB3TextMapCodec } = require('jaeger-client');

module.exports = ({ config }) => {
  const tracer = initTracer({
    serviceName: config.tracer.name,
  });

  const format = 'header';
  const codec = new ZipkinB3TextMapCodec({ urlEncoding: true });
  tracer.registerExtractor(format, codec);
  tracer.registerInjector(format, codec);

  const { inject, extract } = tracer;
  tracer.inject = (span, header) => inject.bind(tracer)(span, format, header);
  tracer.extract = (header) => extract.bind(tracer)(format, header);

  return tracer;
};
