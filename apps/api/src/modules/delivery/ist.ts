/** India has no daylight saving, so a fixed +05:30 offset is exact. */
const IST_OFFSET_MS = 5.5 * 3_600_000;

/** YYYY-MM-DD for a moment, in IST. */
export function istDate(d: Date) {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Minutes since IST midnight for a moment. */
export function istMinutes(d: Date) {
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes();
}

/** The UTC moment for an IST date ("2026-11-05") and time ("15:30"). */
export function istMoment(date: string, time: string) {
  return new Date(`${date}T${time}:00+05:30`);
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h! * 60 + m!;
};

/** "3 pm", "12:30 pm" */
export function timeLabel(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  const hour = h % 12 || 12;
  return `${hour}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
}

/** "Today", "Tomorrow", "Sat 8 Nov" relative to `today` (both YYYY-MM-DD, IST). */
export function dayLabel(date: string, today: string) {
  const diff = Math.round((Date.parse(date) - Date.parse(today)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return new Date(`${date}T12:00:00+05:30`).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
