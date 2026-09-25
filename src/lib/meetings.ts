/**
 * Meeting numbers ("zjazdy") written in a class of a weekend / part-time plan.
 *
 * Sheets are typed by hand, so the list comes in many forms: "zj.2,3,5", "zj. 9, 10",
 * "zj 3", "zj..2,3", "zj,1,2", "zj.8.9". Some classes give dates after "zj." instead
 * ("zj. 17.11, 15.12") - a list of day.month pairs with a day above any meeting number.
 */
const LIST_RE = /\bzj(?![a-ząćęłńóśźż])[.,]*\s*((?:\d{1,2}(?:\s*[.,;]\s*(?=\d))?)+)/gi;
const DATE_LIST_RE = /^\d{1,2}\.\d{1,2}(?:\s*[,;]\s*\d{1,2}\.\d{1,2})*$/;
const MAX_MEETING = 20;
const FIRST_DATE_DAY = 15; // "zj. 17.11" is a date, "zj.8.9" meetings 8 and 9

export interface MeetingInfo {
  meetings: string[]; // "0", "1", ...
  dates: Set<string>; // "d.m" written after "zj."
}

export const parseMeetings = (text: string): MeetingInfo => {
  const meetings: string[] = [];
  const dates = new Set<string>();
  for (const m of text.matchAll(LIST_RE)) {
    const list = m[1].trim();
    const pairs = [...list.matchAll(/(\d{1,2})\.(\d{1,2})/g)];
    if (DATE_LIST_RE.test(list) && pairs.some(([, d, mo]) => Number(d) >= FIRST_DATE_DAY && Number(mo) <= 12)) {
      pairs.forEach(([, d, mo]) => dates.add(`${Number(d)}.${Number(mo)}`));
      continue;
    }
    for (const n of list.match(/\d{1,2}/g) || []) {
      if (Number(n) <= MAX_MEETING) meetings.push(String(Number(n)));
    }
  }
  return { meetings, dates };
};

/** True when the text lists meeting numbers at all (plan needs a meeting calendar). */
export const hasMeetingNumbers = (text: string) => parseMeetings(text).meetings.length > 0;
