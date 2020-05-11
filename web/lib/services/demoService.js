const { object, string } = require('yup');

const haloInputSchema = object({ name: string().required().min(2) });

/**
 *
 * @param {{
 *  userID: string,
 *  axios: import('axios').default,
 * }} param0
 */
module.exports = function makeDemoService({ userID, axios }) {
  /**
   *
   * @param {{
   *  name: string,
   * }} params
   */
  const halo = async (params) => {
    const { name } = await haloInputSchema.validate(params);

    return `halo ${name}! - ${userID}`;
  };

  const getBaidu = async () => {
    const res = await axios.get('http://baidu.com');

    return res.data;
  };

  return {
    halo,
    getBaidu,
  };
};
