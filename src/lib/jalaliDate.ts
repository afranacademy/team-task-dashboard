import dayjs from 'dayjs';
import jalaliday from 'jalaliday';

// فعال‌کردن پلاگین جلالی برای dayjs
dayjs.extend(jalaliday);

/**
 * Convert an ISO (Gregorian) date string "YYYY-MM-DD" to Jalali (Hijri Shamsi)
 * and return a Farsi formatted string like "۱۴۰۳/۰۹/۰۴".
 */
export function formatJalaliDate(dateIso: string | null | undefined): string {
  if (!dateIso) return '';

  // dayjs(dateIso) expects Gregorian; .calendar('jalali') switches to Jalali
  const d = dayjs(dateIso).calendar('jalali');

  // Format like "1403/09/04" then we can convert digits to Persian if needed
  const formatted = d.format('YYYY/MM/DD');

  // تبدیل به ارقام فارسی
  return toPersianDigits(formatted);
}

/**
 * Optional: Jalali full date with weekday, e.g. "دوشنبه ۱۴۰۳/۰۹/۰۴"
 */
export function formatJalaliFull(dateIso: string | null | undefined): string {
  if (!dateIso) return '';

  const d = dayjs(dateIso).calendar('jalali');
  const weekdayFa = d.locale('fa').format('dddd'); // نام روز هفته

  const base = d.format('YYYY/MM/DD');
  return `${weekdayFa} ${toPersianDigits(base)}`;
}

/**
 * Simple helper to convert Latin digits to Persian digits
 */
export function toPersianDigits(input: string): string {
  const enToFa: Record<string, string> = {
    '0': '۰',
    '1': '۱',
    '2': '۲',
    '3': '۳',
    '4': '۴',
    '5': '۵',
    '6': '۶',
    '7': '۷',
    '8': '۸',
    '9': '۹',
  };

  return input.replace(/[0-9]/g, d => enToFa[d] ?? d);
}