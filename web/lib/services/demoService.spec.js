const makeDemoService = require('./demoService');

it('call halo should be ok', async () => {
  const userID = Math.random();
  const name = Math.random();
  const demoService = makeDemoService({ userID });
  const ret = await demoService.halo({ name });

  expect(ret).toBe(`halo ${name}! - ${userID}`);
});
