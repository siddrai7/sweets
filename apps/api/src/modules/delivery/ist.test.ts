import { describe, expect, it } from 'vitest';
import { addDays, dayLabel, istDate, istMinutes, istMoment, timeLabel } from './ist';

describe('IST helpers', () => {
  it('converts between UTC moments and IST dates/times', () => {
    const m = istMoment('2026-11-05', '15:30');
    expect(m.toISOString()).toBe('2026-11-05T10:00:00.000Z');
    expect(istDate(new Date('2026-11-05T19:00:00Z'))).toBe('2026-11-06'); // 00:30 IST next day
    expect(istMinutes(new Date('2026-11-05T10:00:00Z'))).toBe(15 * 60 + 30);
  });
  it('labels days and times', () => {
    expect(dayLabel('2026-11-05', '2026-11-05')).toBe('Today');
    expect(dayLabel('2026-11-06', '2026-11-05')).toBe('Tomorrow');
    expect(timeLabel('15:00')).toBe('3 pm');
    expect(timeLabel('12:30')).toBe('12:30 pm');
    expect(timeLabel('09:00')).toBe('9 am');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
