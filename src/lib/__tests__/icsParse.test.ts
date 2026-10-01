import { describe, expect, it } from 'vitest';
import { parseSingleHtmlTable } from '@/lib/icsParse';

const NOW = new Date('2026-10-01T10:00:00Z'); // winter semester 2026/27
const ZJAZDY = {
  '1': ['2026-10-09', '2026-10-10', '2026-10-11'],
  '2': ['2026-11-27', '2026-11-28', '2026-11-29'],
};
const table = (rows: string[][]) =>
  `<table><tr><th><b>Godziny</b></th><th><b>Piątek</b></th><th><b>Sobota</b></th></tr>` +
  rows.map(([time, fri, sat]) => `<tr><td>${time}</td><td>${fri}</td><td>${sat}</td></tr>`).join('') + '</table>';
const days = (events: { startDate: string; title: string }[], title: string) =>
  events.filter(e => e.title.startsWith(title)).map(e => e.startDate.slice(0, 10)).sort();

describe('parseSingleHtmlTable', () => {
  it('dates meeting numbers by the calendar and the weekday of the column', () => {
    const html = table([['8<sup>15</sup> - 9<sup>00</sup>', '', 'Sieci - laboratorium 15h zj.1,2 sala']]);
    expect(days(parseSingleHtmlTable(html, ZJAZDY, undefined, NOW), 'Sieci')).toEqual(['2026-10-10', '2026-11-28']);
  });

  it('turns every class of a cell into its own events', () => {
    const cell = '<div data-lesson>Krajobraz - wykład zj.1 sala</div><div data-lesson>Krajobraz - projekt zj.2 sala</div>';
    const events = parseSingleHtmlTable(table([['8<sup>15</sup> - 9<sup>00</sup>', '', cell]]), ZJAZDY, undefined, NOW);
    expect(days(events, 'Krajobraz - wykład')).toEqual(['2026-10-10']);
    expect(days(events, 'Krajobraz - projekt')).toEqual(['2026-11-28']);
  });

  it('keeps classes whose name contains "DATA" (not a dates list)', () => {
    const html = table([['17<sup>00</sup> - 17<sup>45</sup>', 'Sp.: Wstęp do BIG DATA - laboratorium 20h zj.1,2', '']]);
    expect(days(parseSingleHtmlTable(html, ZJAZDY, undefined, NOW), 'Sp.: Wstęp do BIG DATA')).toEqual(['2026-10-09', '2026-11-27']);
  });

  it('reads dates written in the class, also after zj.', () => {
    const html = table([['8<sup>15</sup> - 9<sup>00</sup>', 'Dietetyka - ćwiczenia zj. 16.10, 15.01', 'Lektorat - lektorat daty: 10.10, 17.10']]);
    const events = parseSingleHtmlTable(html, ZJAZDY, undefined, NOW);
    expect(days(events, 'Dietetyka')).toEqual(['2026-10-16', '2027-01-15']);
    expect(days(events, 'Lektorat')).toEqual(['2026-10-10', '2026-10-17']);
  });

  it('uses the meeting of the sheet for classes without numbers and joins consecutive hours', () => {
    const cls = 'Chirurgia - ćwiczenia 15h sala';
    const html = table([['8<sup>15</sup> - 9<sup>00</sup>', '', cls], ['9<sup>05</sup> - 9<sup>50</sup>', '', cls]]);
    const events = parseSingleHtmlTable(html, ZJAZDY, '2', NOW);
    expect(events).toHaveLength(1);
    expect(events[0].startDate).toBe('2026-11-28T08:15:00');
    expect(events[0].endDate).toBe('2026-11-28T09:50:00');
  });

  it('reads the unusual notations of meeting lists', () => {
    const html = table([['8<sup>15</sup> - 9<sup>00</sup>', '', 'Fizjologia - ćwiczenia 30h zj..1,2 sala']]);
    expect(days(parseSingleHtmlTable(html, ZJAZDY, undefined, NOW), 'Fizjologia')).toEqual(['2026-10-10', '2026-11-28']);
  });
});
