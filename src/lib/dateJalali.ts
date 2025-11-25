import dayjs from 'dayjs';
import jalaliday from 'jalaliday';

dayjs.extend(jalaliday);

export function formatJalaliDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  const d = dayjs(isoDate).calendar('jalali');
  if (!d.isValid()) return isoDate;
  return d.format('YYYY/MM/DD');
}
