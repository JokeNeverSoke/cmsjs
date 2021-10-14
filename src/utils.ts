export type DayKey = 'Mon' | 'Tues' | 'Wed' | 'Thur' | 'Fri' | 'Sat' | 'Sun';
export type PeriodInfo = { name: string; location: string; source: string };
export type DayInfo = Record<number, PeriodInfo | null>;
export type TableInfo = Record<DayKey, DayInfo>;

/** takes the raw html string of a period in getstudentcal and extracts information */
export const extractInfo = (html: string): PeriodInfo => {
  const g =
    /'c1'>(?<name>[^<>]+)<\/.*?(?:\((?<location>[\w]+)\))\((?<source>[\w]+)\)/g.exec(
      html
    )!.groups!;
  return {
    name: g.name,
    location: g.location,
    source: g.source,
  };
};

/** transform the raw json return of getstudentcal into a different shape */
export const transformTable = (cal: any): TableInfo => {
  const u: Array<{ key: string; actual: DayKey }> = [
    {
      key: 'M',
      actual: 'Mon',
    },
    {
      key: 'Tu',
      actual: 'Tues',
    },
    {
      key: 'W',
      actual: 'Wed',
    },
    {
      key: 'Th',
      actual: 'Thur',
    },
    {
      key: 'F',
      actual: 'Fri',
    },
    {
      key: 'Sat',
      actual: 'Sat',
    },
    {
      key: 'Sun',
      actual: 'Sun',
    },
  ];
  const kal: Partial<TableInfo> = {};
  u.forEach(({ key, actual }) => {
    const subcal: Record<number, PeriodInfo | null> = {};
    for (let i = 1; i < 16; i++) {
      const k = `${key}${i}`;
      subcal[i] = cal[k] ? extractInfo(cal[k]) : null;
    }
    kal[actual] = subcal;
  });
  return kal as TableInfo;
};
