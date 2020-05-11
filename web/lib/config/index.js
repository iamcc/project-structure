require('dotenv').config({ path: `${__dirname}/.env` });

const yup = require('yup');

const pkg = require('../../package.json');

const envSchema = yup
  .object({
    NODE_ENV: yup.string().required().default('production'),
    PORT: yup.string().required().default('8080'),
    LOG_LEVEL: yup
      .string()
      .required()
      .oneOf(['debug', 'info', 'warn', 'error', 'fatal'])
      .default('info'),
  })
  .noUnknown()
  .required();

const envVars = envSchema.validateSync(process.env);

module.exports = {
  env: envVars.NODE_ENV,
  server: {
    port: envVars.PORT,
  },
  log: {
    name: pkg.name,
    level: envVars.LOG_LEVEL,
  },
  tracer: {
    name: pkg.name,
  },
};
