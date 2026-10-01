/**
 * Timetable HTML (the plan of one sheet) -> calendar events with real dates: dates written
 * in a class ("daty: 5.10", "zj. 17.11"), or meeting numbers ("zj.2,3") dated by the meeting
 * calendar (week of the meeting + weekday of the column). Used by the calendar subscription.
 */
import { parseMeetings } from '@/lib/meetings';

export interface CalendarEvent {
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  color?: string;
}

// zjazdy: meeting number -> ISO dates, for plans that list "zj.2,3" instead of dates
// meeting: the meeting of a sheet published per meeting ("zj.5"), for cells without numbers
export function parseSingleHtmlTable(htmlContent: string, zjazdy?: Record<string, string[]>, meeting?: string,
                                     now: Date = new Date()): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  try {
    const tableMatch = htmlContent.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) return events;

    const rowMatches = tableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    if (!rowMatches || rowMatches.length <= 1) return events;

    // Parse header to get day names and their day-of-week numbers
    const headerRow = rowMatches[0];
    const headerCells = headerRow.match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
    const dayCount = headerCells.length - 1;

    // Map column index to expected day-of-week (0=Sun, 1=Mon, ..., 6=Sat)
    const dayNameToNumber: Record<string, number> = {
      'poniedziałek': 1, 'poniedzialek': 1,
      'wtorek': 2,
      'środa': 3, 'sroda': 3,
      'czwartek': 4,
      'piątek': 5, 'piatek': 5,
      'sobota': 6,
      'niedziela': 0,
    };

    const columnDayOfWeek: number[] = [];
    headerCells.forEach((cell, index) => {
      if (index > 0) {
        const text = decodeHtmlEntities(cell.replace(/<[^>]*>/g, '')).trim().toLowerCase().split(' ')[0].split('(')[0].trim();
        columnDayOfWeek.push(dayNameToNumber[text] ?? -1);
      }
    });

    // Academic year: September..December belong to the starting year, the rest to the next one
    const nowWarsaw = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }));
    const startYear = nowWarsaw.getMonth() + 1 >= 9 ? nowWarsaw.getFullYear() : nowWarsaw.getFullYear() - 1;
    const yearFor = (month: number) => (month >= 9 ? startYear : startYear + 1);

    for (let rowIndex = 1; rowIndex < rowMatches.length; rowIndex++) {
      const row = rowMatches[rowIndex];
      const cellMatches = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      if (!cellMatches.length) continue;

      // Hours come from the first cell, e.g. "8<sup>15</sup> - 9<sup>00</sup>"
      const timeText = cellMatches[0].replace(/<[^>]*>/g, ':').replace(/:+/g, ':');
      const tm = timeText.match(/(\d{1,2})\D*?(\d{2})\D+?(\d{1,2})\D*?(\d{2})/);
      if (!tm) continue;
      const timeSlot = {
        start: `${tm[1].padStart(2, '0')}:${tm[2]}`,
        end: `${tm[3].padStart(2, '0')}:${tm[4]}`,
      };

      for (let dayIndex = 0; dayIndex < dayCount && (dayIndex + 1) < cellMatches.length; dayIndex++) {
        const cell = cellMatches[dayIndex + 1];
        // Plan HTML escapes cell text (&amp;, &lt;, ...) - the calendar needs plain text
        // classes of one cell come as <div data-lesson> - a blank line between them, as in Excel
        const cellText = decodeHtmlEntities(cell.replace(/<br\s*\/?>/gi, '\n').replace(/<\/div>/gi, '\n\n')
          .replace(/<[^>]*>/g, '')).trim();
        if (!cellText) continue;

        const expectedDow = columnDayOfWeek[dayIndex];

        // One cell can hold several classes (different dates), separated by a blank line
        cellText.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean).forEach(cellContent => {
          let title = cellContent.split('\n')[0].trim();
          const titleMatch = title.match(/^(.+?)\s*[-–]\s*(laboratorium|wykład|warsztat|ćwiczenia|projekt|seminarium|konwersatorium|lektorat)/i);
          if (titleMatch) title = `${titleMatch[1].trim()} - ${titleMatch[2]}`;
          if (title.length > 60) title = title.substring(0, 57) + '...';

          let location = 'WSPA Lublin';
          const roomMatch = cellContent.match(/sal[aę]\s+([^\s,\n]+)/i);
          if (roomMatch) location = `Sala ${roomMatch[1]}, WSPA Lublin`;
          if (/on-?line/i.test(cellContent)) location = 'Online';

          const eventDates: string[] = [];
          const written = parseMeetings(cellContent);
          // whole word followed by a date - not "BIG DATA - laboratorium"
          const datesMatch = cellContent.match(/\bdat[yae]\b\s*:?\s*((?:\d{1,2}\.\d{1,2}[\s,;.]*)+)/i);
          // "daty: 5.10, 12.10" or dates after "zj." ("zj. 17.11, 15.12")
          const dateList = datesMatch ? datesMatch[1] : written.dates.size ? [...written.dates].join(', ') : null;
          if (dateList) {
            (dateList.match(/(\d{1,2})\.(\d{1,2})/g) || []).forEach(dateStr => {
              const [day, month] = dateStr.split('.').map(n => parseInt(n, 10));
              if (!day || !month || month > 12) return;
              const year = yearFor(month);
              eventDates.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
            });
          } else if (zjazdy) {
            // "zj.2,3,5": the meeting calendar gives the week, the column the weekday
            // (on-line classes may be on a day the calendar omits, e.g. Thursday)
            const meetings = written.meetings;
            if (!meetings.length && meeting) meetings.push(meeting);
            meetings.forEach(n => {
              const first = (zjazdy[String(Number(n))] || [])[0];
              if (!first || expectedDow < 0) return;
              const d = new Date(`${first}T00:00:00Z`);
              d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + ((expectedDow + 6) % 7));
              eventDates.push(d.toISOString().slice(0, 10));
            });
          }

          eventDates.forEach(eventDate => {
            const dateObj = new Date(`${eventDate}T00:00:00Z`);
            if (expectedDow >= 0 && dateObj.getUTCDay() !== expectedDow) return;

            events.push({
              title,
              startDate: `${eventDate}T${timeSlot.start}:00`,
              endDate: `${eventDate}T${timeSlot.end}:00`,
              location,
              description: cellContent.replace(/\n+/g, ' ').trim(),
            });
          });
        });
      }
    }

    // Merge consecutive time slots with identical content on the same date
    // e.g. 3 slots of "Projekt" 11:45, 12:35, 13:30 -> one event 11:45-14:15
    const minutes = (iso: string) => { const [h, m] = iso.split('T')[1].split(':').map(Number); return h * 60 + m; };
    const mergedEvents: CalendarEvent[] = [];
    const byDateAndDay = new Map<string, CalendarEvent[]>();

    events.forEach(e => {
      const dateKey = e.startDate.split('T')[0];
      const key = `${dateKey}|${e.title}|${e.location}`;
      if (!byDateAndDay.has(key)) byDateAndDay.set(key, []);
      byDateAndDay.get(key)!.push(e);
    });

    byDateAndDay.forEach(group => {
      group.sort((a, b) => a.startDate.localeCompare(b.startDate));
      let current = { ...group[0] };
      for (const e of group.slice(1)) {
        const gap = minutes(e.startDate) - minutes(current.endDate);
        if (gap <= 20) {
          if (e.endDate > current.endDate) current.endDate = e.endDate;
        } else {
          mergedEvents.push(current);
          current = { ...e };
        }
      }
      mergedEvents.push(current);
    });

    mergedEvents.sort((a, b) => a.startDate.localeCompare(b.startDate));
    console.log(`Parsed ${events.length} raw -> ${mergedEvents.length} merged events (day-matched)`);
    return mergedEvents;

  } catch (error) {
    console.error('Error parsing HTML for events:', error);
    return events;
  }
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x?0*27;/gi, "'")
    .replace(/&amp;/g, '&');
}
