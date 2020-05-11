const scopeAxios = require('./scopeAxios');
const scopeContainer = require('./scopeContainer');
const attachTraceID = require('./attachTraceID');
const errorHandler = require('./errorHandler');
const responseHandler = require('./responseHandler');
const attachUserID = require('./attachUserID');

module.exports = {
  scopeAxios,
  scopeContainer,
  attachTraceID,
  errorHandler,
  responseHandler,
  attachUserID,
};
