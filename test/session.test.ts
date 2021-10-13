import { getSession } from '../src';

describe('create session', () => {
  it('should create session', async () => {
    const psid = 's9999';
    const password = '123456789';
    const session = await getSession({ psid, password });
    expect(session.psid).toEqual(psid);
    expect(session.password).toEqual(password);
    expect(session.cookies).toEqual(true);
    session.close()
  });
});
