/**
 * Pure helpers of the timetable view: which classes are held on a date (dates written in
 * the class, meeting numbers dated by the meeting calendar), the dates of a class for the
 * whole-semester view, and the classes of a cell. Kept out of the component so they are
 * unit-tested (src/lib/__tests__).
 */
import { getWeekRange } from '@/lib/utils';
import { parseMeetings } from '@/lib/meetings';

const WEEKDAYS = ['poniedzialek', 'wtorek', 'sroda', 'czwartek', 'piatek', 'sobota', 'niedziela'];

/** Offset from Monday (0-6) of a Polish weekday header, null if unknown. */
export const weekdayOffset = (name: string): number | null => {
    const key = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/[^a-z]/g, '');
    const i = WEEKDAYS.findIndex(d => key.startsWith(d.slice(0, 4)));
    return i >= 0 ? i : null;
};

/** Meeting numbers from the "zj.2,3,5" lists of a cell. */
export const meetingsInCell = (text: string): string[] => parseMeetings(text).meetings;

/** Dates ("d.m") from the "daty: 05.10, 12.10" lists of a cell (or "zj. 17.11, 15.12"). */
export const datesInCell = (text: string): Set<string> => {
    const found = parseMeetings(text).dates;
    for (const list of text.matchAll(/\bdat[yae]\b\s*:?\s*((?:\d{1,2}\.\d{1,2}[\s,;.]*)+)/gi)) {
        for (const [, d, m] of list[1].matchAll(/(\d{1,2})\.(\d{1,2})/g)) found.add(`${Number(d)}.${Number(m)}`);
    }
    return found;
};

/** Is a class held on the date? Its own list of dates decides; else its meeting numbers
 * ("zj.2,3", or the meeting of its sheet) dated by the meeting calendar and matched by week
 * (on-line classes may fall on a day the calendar omits, e.g. Thursday); a class with
 * neither is held every week. */
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// strict: a class with meeting numbers but no meeting calendar counts as not held
// (the current class must be certain; the week filter rather shows it)
export const heldOn = (text: string, date: Date, zjazdy?: Record<string, string[]>, ownMeeting?: string,
                strict = false): boolean => {
    const dates = datesInCell(text);
    if (dates.size) return dates.has(`${date.getDate()}.${date.getMonth() + 1}`);
    const meetings = meetingsInCell(text);
    if (!meetings.length && ownMeeting) meetings.push(ownMeeting);
    if (meetings.length && zjazdy) {
        const week = getWeekRange(date);
        const from = isoDate(week.start), to = isoDate(week.end);
        return meetings.some(n => (zjazdy[n] || []).some(day => day >= from && day <= to));
    }
    return !(strict && meetings.length);
};

/** Dates of a class listed by meeting numbers, in the column's weekday (offset from Monday). */
export const meetingDates = (text: string, weekday: number, zjazdy?: Record<string, string[]>, ownMeeting?: string): Date[] => {
    if (!zjazdy || datesInCell(text).size) return [];
    const meetings = meetingsInCell(text);
    if (!meetings.length && ownMeeting) meetings.push(ownMeeting);
    return [...new Set(meetings)].flatMap(n => {
        const first = zjazdy[n]?.[0];
        if (!first) return [];
        const monday = getWeekRange(new Date(`${first}T12:00:00`)).start;
        return [new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + weekday, 12)];
    }).sort((a, b) => a.getTime() - b.getTime());
};

/** Classes of a cell: several classes in one cell are <div data-lesson>, merged plans
 * wrap every sheet's content in a merge block; otherwise the cell itself. */
export const lessonsOf = (cell: Element): Element[] => {
    const lessons = [...cell.querySelectorAll('[data-lesson]')];
    const blocks = [...cell.querySelectorAll('[data-merge-block]')].filter(b => !b.querySelector('[data-lesson]'));
    return lessons.length || blocks.length ? [...blocks, ...lessons] : [cell];
};
export const sourceOf = (el: Element) => el.closest('[data-merge-block]')?.getAttribute('data-merge-source') ?? null;

/** "Subject - type ..." -> bold subject on its own line (first text of the class, not the merge label). */
export const boldSubject = (el: Element) => {
    const doc = el.ownerDocument;
    const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent || '';
        if (!text.trim() || node.parentElement?.closest('.text-xs')) continue;
        const m = text.match(/^(\s*)(.+?)\s+[-–]\s+/);
        if (!m) return;
        const strong = doc.createElement('strong');
        strong.className = 'text-wspia-gray';
        strong.textContent = m[2];
        node.parentNode?.insertBefore(strong, node);
        node.parentNode?.insertBefore(doc.createElement('br'), node);
        node.textContent = text.slice(m[0].length);
        return;
    }
};
