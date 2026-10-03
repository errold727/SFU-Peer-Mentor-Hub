import { differenceInCalendarDays, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
export const TIME_ZONE = 'America/Vancouver';
export const localDate = (now = new Date()) => formatInTimeZone(now, TIME_ZONE, 'yyyy-MM-dd');
export const daysUntil = (date: string, now = new Date()) => differenceInCalendarDays(parseISO(date), parseISO(localDate(now)));
export function getDeadlineStatus(date: string, now = new Date()) { const days = daysUntil(date, now); return days < 0 ? 'past' : days === 0 ? 'today' : days === 1 ? 'tomorrow' : days <= 7 ? 'thisWeek' : 'upcoming'; }
export function getRelativeDeadlineLabel(date: string, now = new Date()) { const days = daysUntil(date, now); return days < 0 ? 'PAST' : days === 0 ? 'TODAY' : days === 1 ? 'TOMORROW' : days <= 7 ? `IN ${days} DAYS` : 'UPCOMING'; }
export function currentTerm(now = new Date()) { const [year, month] = localDate(now).split('-').map(Number); return `${month <= 4 ? 'Spring' : month <= 8 ? 'Summer' : 'Fall'} ${year}`; }
