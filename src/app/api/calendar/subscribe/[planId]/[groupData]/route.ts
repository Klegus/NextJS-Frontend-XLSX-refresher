import { NextRequest, NextResponse } from 'next/server';
import { protectLecturers } from '@/lib/lecturers';
import { API_URL } from '@/lib/config';

// Shorten lecturers' names in the feed when the access mode requires it
function protectPlanData(data: any) {
  if (!data) return data;
  if (typeof data.plan_html === 'string') data.plan_html = protectLecturers(data.plan_html);
  if (data.group_htmls) {
    data.group_htmls = Object.fromEntries(
      Object.entries(data.group_htmls as Record<string, string>).map(([g, html]) => [g, protectLecturers(html)])
    );
  }
  return data;
}

interface CalendarEvent {
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  color?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string; groupData: string }> }
) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;

    // Add logging for debugging
    console.log('Calendar subscription API called with params:', resolvedParams);
    console.log('Request URL:', request.url);

    // Decode group data - może być:
    // "grupa-1" (zwykły plan)
    // "grupa-1+sp-ubezpieczenia" (plan mieszany)
    const decodedGroupData = decodeURIComponent(resolvedParams.groupData);

    let groups: string[];
    let isMixed = false;

    if (decodedGroupData.includes('+')) {
      // Plan mieszany - split na grupy
      groups = decodedGroupData.split('+').map(g => g.trim());
      isMixed = true;
      console.log('Mixed plan detected:', groups);
    } else {
      // Zwykły plan - jedna grupa
      groups = [decodedGroupData];
      console.log('Single plan detected:', groups);
    }

    // Pobierz plan z backendu
    // Use server-side env var for API routes (not embedded in build)
    const backendUrl = API_URL;
    let planData;

    if (isMixed) {
      // Użyj API dla planów mieszanych
      const response = await fetch(`${backendUrl}/api/plan/${resolvedParams.planId}/mixed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Calendar-Subscription/1.0'
        },
        body: JSON.stringify({ groups: groups })
      });

      if (!response.ok) {
        throw new Error(`Mixed plan API error: ${response.status}`);
      }

      planData = await response.json();
      planData = protectPlanData(planData);
      console.log('Mixed plan data received:', Object.keys(planData));
    } else {
      // Użyj API dla zwykłych planów
      const response = await fetch(`${backendUrl}/api/plan/${resolvedParams.planId}/${groups[0]}`, {
        headers: {
          'User-Agent': 'Calendar-Subscription/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Single plan API error: ${response.status}`);
      }

      planData = await response.json();
      planData = protectPlanData(planData);
      console.log('Single plan data received:', Object.keys(planData));
    }

    // Mixed plans have different structure - they have group_htmls instead of plan_html
    if (!planData || (!planData.plan_html && !planData.group_htmls)) {
      console.error('Invalid plan data structure:', planData);
      throw new Error('No plan data available');
    }

    // For mixed plans, we need to parse each group's HTML separately and merge events
    if (isMixed && planData.group_htmls) {
      console.log('Processing mixed plan with groups:', Object.keys(planData.group_htmls));

      // Don't just concatenate HTML - we need to parse each group separately
      // and merge events at the same time slots
      // Keep group_htmls for proper parsing
      planData.isMixedPlan = true;
    }

    // Wygeneruj ICS content
    const icsContent = generateDynamicICS(planData, {
      planId: resolvedParams.planId,
      groups: groups,
      isMixed: isMixed
    });

    // Debug: log first few lines of ICS content
    console.log('Generated ICS content (first 500 chars):', icsContent.substring(0, 500));

    // Smart refresh intervals - more frequent since we show limited timeframe
    const getRefreshInterval = () => {
      const hour = new Date().getHours();
      const dayOfWeek = new Date().getDay();

      // Weekend - less frequent refresh
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 7200; // 2 hours
      }

      // Peak hours (7-20) - more frequent refresh
      if (hour >= 7 && hour <= 20) {
        return 900; // 15 minutes
      }

      // Evening/night - less frequent refresh
      return 3600; // 1 hour
    };

    const refreshInterval = getRefreshInterval();
    const calendarName = `Plan zajęć - ${groups.join(' + ')}`;
    const calendarDescription = `Automatycznie aktualizowany plan zajęć WSPA (3 tygodnie, odświeżanie co 15 minut) ${isMixed ? '- mieszany' : ''}`;

    // Simply return the ICS content as a string response
    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="plan-zajec.ics"`,
        // Aggressive cache control for 15-minute refresh
        // Use max-age with must-revalidate for better client support
        'Cache-Control': 'public, max-age=900, s-maxage=900, must-revalidate, proxy-revalidate',  // 15 minutes
        'Pragma': 'no-cache',
        // Set expires header to 15 minutes from now
        'Expires': new Date(Date.now() + 15 * 60 * 1000).toUTCString(),
        // Additional refresh hints for different clients
        'Refresh': '900',  // 15 minutes in seconds (for some HTTP clients)
        'X-Refresh': 'PT15M',  // ISO 8601 duration
        'X-Published-TTL': 'PT15M',  // For Apple Calendar (duplicate of ICS property)
        'X-WR-REFRESH-INTERVAL': 'PT15M',  // For some calendar clients
        // ETag for cache validation
        'ETag': generateETag(planData, groups),
        // Last-Modified header
        'Last-Modified': new Date().toUTCString(),
        // CORS headers for calendar apps
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '900',  // CORS preflight cache for 15 minutes
      },
    });

  } catch (error) {
    console.error('Calendar subscription error:', error);

    // Return a basic error calendar
    const errorIcs = generateErrorICS(error instanceof Error ? error.message : 'Unknown error');

    return new NextResponse(errorIcs, {
      status: 500,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

function generateDynamicICS(planData: any, options: {
  planId: string;
  groups: string[];
  isMixed: boolean;
}): string {
  const events: CalendarEvent[] = [];

  // Parse HTML table and extract events
  try {
    // Pass the entire planData object to parseHtmlForEvents for proper mixed plan handling
    const extractedEvents = parseHtmlForEvents(planData, options);
    events.push(...extractedEvents);

  } catch (error) {
    console.error('Error parsing plan HTML:', error);
    // Return empty calendar if parsing fails
  }

  // Generate ICS content
  return generateIcsContent(events, {
    calendarName: `Plan zajęć - ${options.groups.join(' + ')}`,
    calendarId: `wspa-plan-${options.planId}-${options.groups.join('-')}`,
    description: `Automatycznie aktualizowany plan zajęć WSPA (3 tygodnie, odświeżanie co 15 minut) ${options.isMixed ? '- mieszany' : ''}`
  });
}

// Helper function to group similar events that occur at same time on different days
function groupSimilarEvents(events: CalendarEvent[]): CalendarEvent[] {
  const eventGroups = new Map<string, CalendarEvent[]>();

  // Group events by title, time, and location
  events.forEach(event => {
    // Extract just the time portion for grouping (HH:MM)
    const startTime = event.startDate.split('T')[1];
    const endTime = event.endDate.split('T')[1];

    // Create a key for grouping similar events
    const key = `${event.title}|${startTime}|${endTime}|${event.location}`;

    if (!eventGroups.has(key)) {
      eventGroups.set(key, []);
    }
    eventGroups.get(key)!.push(event);
  });

  // Convert groups back to individual events
  // If events occur on consecutive days with same time, they're likely the same recurring event
  const resultEvents: CalendarEvent[] = [];

  eventGroups.forEach((group) => {
    if (group.length === 1) {
      // Single occurrence - keep as is
      resultEvents.push(group[0]);
    } else {
      // Multiple occurrences - create a recurring event
      // Sort by date
      group.sort((a, b) => a.startDate.localeCompare(b.startDate));

      // Check if events are on consecutive weeks (weekly pattern)
      const dates = group.map(e => new Date(e.startDate.split('T')[0]));
      const dayOfWeek = dates[0].getDay();
      const allSameWeekday = dates.every(d => d.getDay() === dayOfWeek);

      if (allSameWeekday && group.length >= 2) {
        // Create a recurring weekly event with specific dates
        const firstEvent = group[0];
        const lastEvent = group[group.length - 1];

        // Add recurrence info to the description
        const recurrenceInfo = `\n\n📅 Zajęcia odbywają się w terminach: ${dates.map(d =>
          d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })
        ).join(', ')}`;

        resultEvents.push({
          ...firstEvent,
          description: firstEvent.description + recurrenceInfo,
          // Mark as recurring with custom field (will be used in ICS generation)
          recurring: true,
          recurrenceDates: group.map(e => e.startDate)
        } as CalendarEvent & { recurring?: boolean; recurrenceDates?: string[] });
      } else {
        // Not a clean weekly pattern - keep as separate events
        group.forEach(event => {
          resultEvents.push(event);
        });
      }
    }
  });

  // Sort all events by start date
  resultEvents.sort((a, b) => a.startDate.localeCompare(b.startDate));

  return resultEvents;
}

function parseHtmlForEvents(planData: any, options: any): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  try {
    console.log(`Parsing HTML for plan ${options.planId}, groups: ${options.groups.join(', ')}`);

    // Check if this is a mixed plan with separate HTMLs
    if (options.isMixed && planData.group_htmls) {
      console.log('Parsing mixed plan with separate group HTMLs');

      // Parse each group's HTML separately
      const eventsByTimeSlot = new Map<string, CalendarEvent[]>();

      Object.entries(planData.group_htmls).forEach(([groupName, groupHtml]) => {
        console.log(`Parsing HTML for group: ${groupName}`);
        const groupEvents = parseSingleHtmlTable(groupHtml as string);

        // Group events by time slot for merging
        groupEvents.forEach(event => {
          const key = `${event.startDate}|${event.endDate}`;
          if (!eventsByTimeSlot.has(key)) {
            eventsByTimeSlot.set(key, []);
          }
          eventsByTimeSlot.get(key)!.push(event);
        });
      });

      // Merge events at the same time slots
      eventsByTimeSlot.forEach((eventsAtSameTime) => {
        if (eventsAtSameTime.length === 1) {
          events.push(eventsAtSameTime[0]);
        } else {
          // Multiple events at same time - merge them
          const merged = {
            title: eventsAtSameTime.map(e => e.title).join(' | '),
            startDate: eventsAtSameTime[0].startDate,
            endDate: eventsAtSameTime[0].endDate,
            location: eventsAtSameTime.map(e => e.location).filter((v, i, a) => a.indexOf(v) === i).join(' / '),
            description: eventsAtSameTime.map(e => e.description).join('\n---\n'),
          };
          events.push(merged);
        }
      });

      // Sort events by date
      events.sort((a, b) => a.startDate.localeCompare(b.startDate));

    } else {
      // Single plan - parse normally
      const parsedEvents = parseSingleHtmlTable(planData.plan_html || planData);
      events.push(...parsedEvents);
    }

    console.log(`Parsed ${events.length} total events`);

    // No date filtering — return ALL events from the plan.
    // Calendar apps handle display of past/future events themselves.
    // This also means the subscription always has the full semester schedule.
    return events;

  } catch (error) {
    console.error('Error parsing HTML for events:', error);
    return events; // Return empty array on error
  }
}

function parseSingleHtmlTable(htmlContent: string): CalendarEvent[] {
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
        const text = cell.replace(/<[^>]*>/g, '').trim().toLowerCase().split(' ')[0].split('(')[0].trim();
        columnDayOfWeek.push(dayNameToNumber[text] ?? -1);
      }
    });

    // Academic year: September..December belong to the starting year, the rest to the next one
    const nowWarsaw = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }));
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
        const cellText = cell.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim();
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

          const datesMatch = cellContent.match(/dat[yae]:?\s*([\d.,;\s]+)/i);
          if (!datesMatch) return;
          const specificDates = datesMatch[1].match(/(\d{1,2})\.(\d{1,2})/g) || [];

          specificDates.forEach(dateStr => {
            const [day, month] = dateStr.split('.').map(n => parseInt(n, 10));
            if (!day || !month || month > 12) return;
            const year = yearFor(month);
            const dateObj = new Date(Date.UTC(year, month - 1, day));
            if (expectedDow >= 0 && dateObj.getUTCDay() !== expectedDow) return;
            const eventDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

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

function generateIcsContent(events: CalendarEvent[], meta: {
  calendarName: string;
  calendarId: string;
  description: string;
}): string {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Plan Zajec WSPA//Calendar Subscription//PL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(meta.calendarName)}`,
    `X-WR-CALDESC:${escapeIcsText(meta.description)}`,
    `X-WR-RELCALID:${meta.calendarId}`,
    'X-WR-TIMEZONE:Europe/Warsaw',
    // Multiple refresh interval properties for maximum client compatibility
    'X-PUBLISHED-TTL:PT15M',  // Apple Calendar - 15 minutes
    'REFRESH-INTERVAL;VALUE=DURATION:PT15M',  // RFC 7986 standard - 15 minutes
    'X-REFRESH-INTERVAL:PT15M',  // Microsoft Outlook - 15 minutes
    'X-WR-REFRESH-INTERVAL:PT15M',  // Some other clients - 15 minutes
    'X-APPLE-AUTO-REFRESH-INTERVAL:PT15M',  // Apple Calendar alternate property
    'X-MICROSOFT-CDO-REFRESH-INTERVAL:15',  // Legacy Outlook (in minutes)
    'AUTO-REFRESH;VALUE=DURATION:PT15M',  // Alternative standard format
    // Times are local Warsaw time, independent of where the server runs
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Warsaw',
    'X-LIC-LOCATION:Europe/Warsaw',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  events.forEach((event: any, index) => {
    ics.push('BEGIN:VEVENT');
    ics.push(`SUMMARY:${escapeIcsText(event.title)}`);

    // Check if this is a recurring event
    if (event.recurring && event.recurrenceDates && event.recurrenceDates.length > 1) {
      // Use first date as start
      const firstDate = event.recurrenceDates[0];
      const lastDate = event.recurrenceDates[event.recurrenceDates.length - 1];

      // Convert date strings to ICS format
      const startDateFormatted = firstDate.replace(/[-:]/g, '');
      const endTime = event.endDate.split('T')[1];
      const endDateFormatted = (firstDate.split('T')[0] + 'T' + endTime).replace(/[-:]/g, '');

      ics.push(`DTSTART;TZID=Europe/Warsaw:${startDateFormatted}`);
      ics.push(`DTEND;TZID=Europe/Warsaw:${endDateFormatted}`);

      // Add RRULE for weekly recurrence with specific dates
      const untilDate = lastDate.replace(/[-:]/g, '').split('T')[0] + 'T235959';
      const dayOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][new Date(firstDate).getDay()];
      ics.push(`RRULE:FREQ=WEEKLY;BYDAY=${dayOfWeek};UNTIL=${untilDate}`);

      // Add RDATE for specific dates (in case pattern is irregular)
      if (event.recurrenceDates.length <= 10) {
        const rdates = event.recurrenceDates.map(d => d.replace(/[-:]/g, '')).join(',');
        ics.push(`RDATE;TZID=Europe/Warsaw:${rdates}`);
      }
    } else {
      // Single event - format normally
      const startDateFormatted = event.startDate.replace(/[-:]/g, '');
      const endDateFormatted = event.endDate.replace(/[-:]/g, '');
      ics.push(`DTSTART;TZID=Europe/Warsaw:${startDateFormatted}`);
      ics.push(`DTEND;TZID=Europe/Warsaw:${endDateFormatted}`);
    }

    // Add current timestamp
    const now = new Date();
    ics.push(`DTSTAMP:${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);

    if (event.location) {
      ics.push(`LOCATION:${escapeIcsText(event.location)}`);
    }

    if (event.description) {
      ics.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }

    // Generate stable UID based on content
    const uid = `wspa-event-${generateEventId(event)}-${index}@planinf.pl`;
    ics.push(`UID:${uid}`);

    ics.push('CATEGORIES:Plan Zajęć');
    ics.push('STATUS:CONFIRMED');
    ics.push('END:VEVENT');
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

function generateErrorICS(errorMessage: string): string {
  const now = new Date();
  const errorEvent = {
    title: 'Błąd planu zajęć',
    startDate: formatDateForIcs(now),
    endDate: formatDateForIcs(new Date(now.getTime() + 3600000)), // 1 hour later
    location: '',
    description: `Wystąpił błąd podczas pobierania planu: ${errorMessage}`,
  };

  return generateIcsContent([errorEvent], {
    calendarName: 'Plan zajęć - Błąd',
    calendarId: 'wspa-plan-error',
    description: 'Kalendarz z błędem pobierania planu'
  });
}

function formatDateForIcs(date: Date): string {
  // Local Warsaw time as YYYY-MM-DDTHH:MM:SS (converted to ICS format when written)
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function generateETag(planData: any, groups: string[]): string {
  // Simple hash based on plan data and groups
  const content = JSON.stringify(planData) + groups.join('-');
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

function generateEventId(event: CalendarEvent): string {
  // Generate stable ID based on event content
  const content = `${event.title}-${event.startDate}-${event.location}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}