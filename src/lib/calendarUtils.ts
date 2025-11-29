export interface MonthDay {
  date: Date;
  iso: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  dayNumber: number;
}

export function getMonthDays(currentMonth: Date): MonthDay[] {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);

  // Day of week for first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = firstDay.getDay();

  // Calculate how many days from previous month to show
  // In Persian calendar, week starts on Saturday (6)
  const daysFromPrevMonth = firstDayOfWeek === 6 ? 0 : firstDayOfWeek + 1;

  // Start date (might be in previous month)
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - daysFromPrevMonth);

  // Build array of days
  const days: MonthDay[] = [];
  const currentDate = new Date(startDate);

  // We need 6 weeks (42 days) to cover all possible month layouts
  for (let i = 0; i < 42; i++) {
    const iso = currentDate.toISOString().split('T')[0];
    const isCurrentMonth = currentDate.getMonth() === month;

    days.push({
      date: new Date(currentDate),
      iso,
      isCurrentMonth,
      dayNumber: currentDate.getDate(),
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
}

export function getMonthRange(currentMonth: Date): { from: string; to: string } {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Extend range to include visible days from prev/next months
  const firstDayOfWeek = firstDay.getDay();
  const daysFromPrevMonth = firstDayOfWeek === 6 ? 0 : firstDayOfWeek + 1;

  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - daysFromPrevMonth);

  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (42 - daysFromPrevMonth - lastDay.getDate()));

  return {
    from: startDate.toISOString().split('T')[0],
    to: endDate.toISOString().split('T')[0],
  };
}

export function getPersianWeekDays(): string[] {
  return ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}
