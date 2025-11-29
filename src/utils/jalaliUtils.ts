// Jalali (Persian) calendar utilities

export interface JalaliDate {
  year: number;
  month: number;
  day: number;
}

const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const JALALI_DAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
const JALALI_DAY_NAMES_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export function toJalali(gDate: Date): JalaliDate {
  const gy = gDate.getFullYear();
  const gm = gDate.getMonth() + 1;
  const gd = gDate.getDate();

  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;

  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];

  const jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;

  let jy2 = jy + 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy2 += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);

  return { year: jy2, month: jm, day: jd };
}

export function toGregorian(jy: number, jm: number, jd: number): Date {
  const sal_a = [0, 31, 62, 93, 124, 155, 186, 216, 246, 276, 306, 336];
  const gy = jy <= 979 ? 621 : 1600;
  const jy2 = jy - (jy <= 979 ? 0 : 979);

  let days =
    365 * jy2 +
    Math.floor(jy2 / 33) * 8 +
    Math.floor(((jy2 % 33) + 3) / 4) +
    78 +
    jd +
    sal_a[jm - 1];

  const gy2 = gy + 400 * Math.floor(days / 146097);
  days %= 146097;

  if (days >= 36525) {
    days--;
    const gy3 = gy2 + 100 * Math.floor(days / 36524);
    days %= 36524;

    if (days >= 365) days++;

    const gy4 = gy3 + 4 * Math.floor(days / 1461);
    days %= 1461;

    if (days >= 366) {
      days--;
      const gy5 = gy4 + Math.floor(days / 365);
      days = days % 365;

      const gm = Math.floor((days + 0.5) / 30.6) + 1;
      const gd = Math.floor(days - (gm - 1) * 30.6 + 1.5);

      return new Date(gy5, gm - 1, gd);
    }

    const gm = Math.floor((days + 0.5) / 30.6) + 1;
    const gd = Math.floor(days - (gm - 1) * 30.6 + 1.5);

    return new Date(gy4, gm - 1, gd);
  }

  const gm = Math.floor((days + 0.5) / 30.6) + 1;
  const gd = Math.floor(days - (gm - 1) * 30.6 + 1.5);

  return new Date(gy2, gm - 1, gd);
}

export function formatJalali(jDate: JalaliDate): string {
  return `${jDate.year}/${String(jDate.month).padStart(2, '0')}/${String(jDate.day).padStart(2, '0')}`;
}

export function getJalaliMonthName(month: number): string {
  return JALALI_MONTH_NAMES[month - 1] || '';
}

export function getJalaliDayNames(): string[] {
  return JALALI_DAY_NAMES;
}

export function getJalaliDayNamesShort(): string[] {
  return JALALI_DAY_NAMES_SHORT;
}

export function getJalaliMonthDays(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isJalaliLeapYear(year) ? 30 : 29;
}

export function isJalaliLeapYear(year: number): boolean {
  const breaks = [1, 5, 9, 13, 17, 22, 26, 30];
  const jp = breaks[0];

  for (let i = 1; i < breaks.length; i++) {
    const jm = breaks[i];
    if (year < jm) break;
  }

  const n = year - jp;
  const mod = ((n + 1) % 33);

  return mod === 1 || mod === 2 || mod === 3 || mod === 4;
}
