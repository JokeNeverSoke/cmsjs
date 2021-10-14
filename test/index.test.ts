import { getSession, extractInfo } from '../src';

describe('session', () => {
  it('should create session', async () => {
    const psid = 's9999';
    const password = '123456789';
    const session = await getSession({ psid, password });
    expect(session.psid).toEqual(psid);
    expect(session.password).toEqual(password);
    expect(session.cookies).toEqual(true);
    await session.close();
  });
});

describe('timetable manager', () => {
  it('should parse correctly', () => {
    expect(
      extractInfo(
        "<div class='istw'><span class='c1'>English-A1.D.ELI</span> <span class='t_10'>(B522)(CSY)</span><div class='ws-div'></div></div>"
      )
    ).toEqual({ name: 'English-A1.D.ELI', location: 'B522', source: 'CSY' });
    expect(() =>
      extractInfo(
        "<div class='istw'><span class='c1'English-A1.D.ELI</span> <span class='t_10'>(B522)(CSY)</span><div class='ws-div'></div></div>"
      )
    ).toThrowError();
  });
});
