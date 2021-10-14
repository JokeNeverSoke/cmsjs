import { extractInfo } from '../src/utils';

describe('timetable manager', () => {
  it('should parse correctly', () => {
    expect(
      extractInfo(
        "<div class='istw'><span class='c1'>English-A1.D.ELI</span> <span class='t_10'>(B522)(CSY)</span><div class='ws-div'></div></div>"
      )
    ).toEqual({ name: 'English-A1.D.ELI', location: 'B522', source: 'CSY' });
    expect(
      extractInfo(
        "<div><span class='c1'>SCIE Uchishi</span> <span class='t_10'>(G021)(ECA)</span></div>"
      )
    ).toEqual({ name: 'SCIE Uchishi', location: 'G021', source: 'ECA' });
    expect(
      extractInfo(
        "<div class='istw'><span class='c1'>Computer Science-AS.C.CPU</span> <span class='t_10'>(B432)(SHW)</span><div class='ws-div'></div></div>"
      )
    ).toEqual({
      name: 'Computer Science-AS.C.CPU',
      location: 'B432',
      source: 'SHW',
    });
    expect(() =>
      extractInfo(
        "<div class='istw'><span class='c1'English-A1.D.ELI</span> <span class='t_10'>(B522)(CSY)</span><div class='ws-div'></div></div>"
      )
    ).toThrowError();
    expect(() =>
      extractInfo(
        "<div class='istw'><span class='c1'></span> <span class='t_10'>(B522)(CSY)</span><div class='ws-div'></div></div>"
      )
    ).toThrowError();
    expect(() =>
      extractInfo(
        "<div><span class='c1'>SCIE Uchishi</span> <span class='t_10'>()(ECA)</span></div>"
      )
    ).toThrowError();
    expect(() =>
      extractInfo(
        "<div><span class='c1'>SCIE Uchishi</span> <span class='t_10'>()(ECA)</span></div>"
      )
    ).toThrowError();
  });
});
