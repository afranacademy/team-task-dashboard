import { Calendar, DayValue } from 'react-modern-calendar-datepicker';

interface PersianDatePickerProps {
  value: string;
  onChange: (isoDate: string) => void;
}

export function PersianDatePicker({ value, onChange }: PersianDatePickerProps) {
  const parseToDayValue = (iso: string): DayValue => {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    return { year: y, month: m, day: d };
  };

  const handleSelect = (day: DayValue) => {
    if (!day) return;
    const iso = `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
    onChange(iso);
  };

  return (
    <div className="z-50">
      <Calendar
        value={parseToDayValue(value)}
        onChange={handleSelect}
        locale="fa"
        shouldHighlightWeekends
        colorPrimary="#8b5cf6"
        minimumDate={{ year: 1380, month: 1, day: 1 }}
      />
    </div>
  );
}
