import { DEFAULT_LANG, LOCALES, translate } from './index';
import type { Lang, TKey } from './types';

// --- Etykieta planu -----------------------------------------------------------

export interface PlanLabelSource {
  name: string;
  short_name?: string;
  year?: number | null;
  semester?: number | null;
  degree?: string | null;
  variant?: string | null;
}

const DEGREE_KEYS: Record<string, TKey> = {
  'I stopnia': 'planLabel.degree.first',
  'II stopnia': 'planLabel.degree.second',
  'jednolite magisterskie': 'planLabel.degree.uniform',
};

const MODE_KEYS: Record<string, TKey> = {
  st: 'planLabel.mode.st',
  nst: 'planLabel.mode.nst',
  nst_puw: 'planLabel.mode.nst_puw',
};

const VARIANT_KEYS: Record<string, TKey> = {
  'zjazdy on-line': 'planLabel.variant.meetingsOnline',
  'zjazdy w siedzibie': 'planLabel.variant.meetingsOnsite',
  'tryb dzienny': 'planLabel.variant.daytime',
  'tryb weekendowy': 'planLabel.variant.weekend',
  'zajęcia praktyczne': 'planLabel.variant.practical',
  'zajęcia on-line': 'planLabel.variant.classesOnline',
  'zajęcia w siedzibie': 'planLabel.variant.classesOnsite',
};

const translateVariantPart = (part: string, lang: Lang): string | null => {
  const key = VARIANT_KEYS[part];
  if (key) return translate(lang, key);
  const meeting = part.match(/^zjazd (\d+)$/);
  if (meeting) return translate(lang, 'planLabel.variant.meetingN', { n: meeting[1] });
  return null;
};

// Buduje przetłumaczoną etykietę z pól strukturalnych; po polsku zwraca short_name bez zmian.
// Gdy brakuje pól albo wartość jest nieznana – fallback na short_name/name z backendu.
export const formatPlanLabel = (plan: PlanLabelSource, category: string | undefined, lang: Lang): string => {
  const fallback = plan.short_name || plan.name;
  if (lang === DEFAULT_LANG) return fallback;

  const degreeKey = plan.degree ? DEGREE_KEYS[plan.degree] : undefined;
  const modeKey = category ? MODE_KEYS[category] : undefined;
  if (!plan.year || !plan.semester || !degreeKey || !modeKey) return fallback;

  const parts = [
    translate(lang, 'planLabel.yearSemester', { year: plan.year, semester: plan.semester }),
    translate(lang, degreeKey),
    translate(lang, modeKey),
  ];

  if (plan.variant) {
    const variants = plan.variant.split(',').map(v => v.trim()).filter(Boolean);
    const translated = variants.map(v => translateVariantPart(v, lang));
    if (translated.some(v => v === null)) return fallback;
    parts.push(translated.join(', '));
  }

  return parts.join(' · ');
};

// --- Daty i czas względny -------------------------------------------------------------

// The university and the backend live in Warsaw: every time is shown in Warsaw
// time, whatever the timezone of the viewer's device
export const WARSAW = 'Europe/Warsaw';

// Warsaw's UTC offset (ms) at a given instant, from Intl (handles DST)
const warsawOffsetMs = (utcMs: number) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: WARSAW, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
};

/**
 * Parse a timestamp from the backend. Strings without a timezone
 * ("2026-09-24 17:22:01", "2026-09-24T17:22:01") are Warsaw wall-clock time;
 * strings with Z / an offset / "GMT" are taken as they are.
 */
export const parseServerDate = (value: string | number | Date): Date => {
  if (value instanceof Date || typeof value === 'number') return new Date(value);
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/);
  if (!m) return new Date(value);
  const wallAsUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  // Two passes settle the offset around DST changes
  let utc = wallAsUtc - warsawOffsetMs(wallAsUtc);
  utc = wallAsUtc - warsawOffsetMs(utc);
  return new Date(utc);
};

export const formatShortDate = (date: Date, lang: Lang) =>
  date.toLocaleDateString(LOCALES[lang], { day: '2-digit', month: '2-digit', timeZone: WARSAW });

export const formatFullDate = (date: Date, lang: Lang) =>
  date.toLocaleDateString(LOCALES[lang], { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: WARSAW });

export const formatTime = (date: Date, lang: Lang) =>
  date.toLocaleTimeString(LOCALES[lang], { hour: '2-digit', minute: '2-digit', timeZone: WARSAW });

export const formatDateTime = (date: Date, lang: Lang) =>
  date.toLocaleString(LOCALES[lang], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: WARSAW });

// Intl.RelativeTimeFormat obsługuje poprawnie formy mnogie pl/uk ("2 godziny temu", "5 годин тому")
const relative = (value: number, unit: Intl.RelativeTimeFormatUnit, lang: Lang, numeric: 'always' | 'auto' = 'always') =>
  new Intl.RelativeTimeFormat(LOCALES[lang], { numeric }).format(-value, unit);

// Czas od ostatniej aktualizacji planu
export const timeSinceUpdate = (timestamp: string, lang: Lang): string => {
  const now = new Date();
  const updateTime = parseServerDate(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - updateTime.getTime()) / 1000);

  const days = Math.floor(diffInSeconds / 86400);
  const hours = Math.floor((diffInSeconds % 86400) / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);

  const timeString = formatTime(updateTime, lang);
  const dateString = formatFullDate(updateTime, lang);

  // Ostatnie 10 minut – dokładna data i godzina
  if (diffInSeconds < 600) {
    return translate(lang, 'time.atDateTime', { date: dateString, time: timeString });
  }

  if (days === 0) {
    if (hours > 0) {
      return translate(lang, 'time.withDate', { rel: relative(hours, 'hour', lang), date: timeString });
    } else if (minutes > 0) {
      return relative(minutes, 'minute', lang);
    }
  }

  if (days >= 1) {
    return translate(lang, 'time.withDate', { rel: relative(days, 'day', lang, days === 1 ? 'auto' : 'always'), date: dateString });
  }

  return dateString;
};

// Data względna dla aktualności
export const formatRelativeDate = (date: Date, lang: Lang): string => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    if (diffMinutes < 60) return relative(diffMinutes, 'minute', lang);
    if (diffHours < 12) return relative(diffHours, 'hour', lang);
    return translate(lang, 'time.today');
  }
  if (isYesterday) return relative(1, 'day', lang, 'auto');
  if (diffDays === 2) return relative(2, 'day', lang, 'auto');
  if (diffDays < 7) return relative(diffDays, 'day', lang);
  if (diffDays < 14) return translate(lang, 'time.weekAgo');
  if (diffDays < 30) return relative(Math.floor(diffDays / 7), 'week', lang);
  if (diffDays < 60) return translate(lang, 'time.monthAgo');
  return formatFullDate(date, lang);
};
