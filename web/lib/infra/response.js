module.exports = {
  success(data) {
    return {
      error_code: 0,
      error_msg: 'SUCCESS',
      data,
    };
  },

  failed(msg, code = -1) {
    return {
      error_code: code,
      error_msg: msg,
    };
  },
};
