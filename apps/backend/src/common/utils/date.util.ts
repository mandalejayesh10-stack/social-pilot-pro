import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export { dayjs };

export function toUTC(date: Date | string): Date {
  return dayjs(date).utc().toDate();
}

export function startOfDay(date: Date | string, tz = 'UTC'): Date {
  return dayjs(date).tz(tz).startOf('day').utc().toDate();
}

export function endOfDay(date: Date | string, tz = 'UTC'): Date {
  return dayjs(date).tz(tz).endOf('day').utc().toDate();
}

export function daysAgo(n: number): Date {
  return dayjs().utc().subtract(n, 'day').startOf('day').toDate();
}

export function formatDate(date: Date | string, format = 'YYYY-MM-DD'): string {
  return dayjs(date).utc().format(format);
}

export function periodLabel(days: number): string {
  if (days <= 7) return '7d';
  if (days <= 30) return '30d';
  return '90d';
}
