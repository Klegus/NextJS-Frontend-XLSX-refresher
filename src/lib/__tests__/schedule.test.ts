import { describe, expect, it } from 'vitest';
import { datesInCell, heldOn, meetingDates, weekdayOffset } from '@/lib/schedule';

// meeting calendar of a weekend programme: meeting -> Fri, Sat, Sun
const ZJAZDY = {
  '1': ['2026-10-09', '2026-10-10', '2026-10-11'],
  '2': ['2026-11-27', '2026-11-28', '2026-11-29'],
  '3': ['2027-01-22', '2027-01-23', '2027-01-24'],
};
const sat = (iso: string) => new Date(`${iso}T12:00:00`);

describe('heldOn', () => {
  it('dates a class by the week of its meeting', () => {
    expect(heldOn('Systemy - projekt zj.1,2 sala', sat('2026-10-10'), ZJAZDY)).toBe(true);
    expect(heldOn('Systemy - projekt zj.1,2 sala', sat('2026-10-17'), ZJAZDY)).toBe(false);
  });

  it('keeps on-line classes on a weekday the calendar omits (Thursday of the meeting week)', () => {
    expect(heldOn('Wykład zj.1 on-line', sat('2026-10-08'), ZJAZDY)).toBe(true);
  });

  it('uses the meeting of a sheet published per meeting when the class lists none', () => {
    expect(heldOn('Chirurgia - ćwiczenia sala', sat('2026-11-28'), ZJAZDY, '2')).toBe(true);
    expect(heldOn('Chirurgia - ćwiczenia sala', sat('2026-10-10'), ZJAZDY, '2')).toBe(false);
  });

  it('prefers dates written in the class', () => {
    expect(heldOn('Lektorat daty: 05.10, 12.10', sat('2026-10-12'), ZJAZDY)).toBe(true);
    expect(heldOn('Lektorat daty: 05.10, 12.10', sat('2026-10-10'), ZJAZDY)).toBe(false);
  });

  it('does not read "BIG DATA" as a list of dates', () => {
    expect(datesInCell('Sp.: Wstęp do BIG DATA - laboratorium 20h zj.1,2,3').size).toBe(0);
    expect(heldOn('Sp.: Wstęp do BIG DATA - laboratorium 20h zj.1,2,3', sat('2026-10-10'), ZJAZDY)).toBe(true);
  });

  it('shows a weekly class every week; strict mode never claims an undatable meeting class', () => {
    expect(heldOn('Programowanie - wykład', sat('2026-10-17'), ZJAZDY)).toBe(true);
    expect(heldOn('Wykład zj.4', sat('2026-10-10'), undefined)).toBe(true);
    expect(heldOn('Wykład zj.4', sat('2026-10-10'), undefined, undefined, true)).toBe(false);
  });
});

describe('meetingDates', () => {
  it('gives the date of every meeting in the column weekday', () => {
    const dates = meetingDates('Projekt zj.1,3', 4 /* Friday */, ZJAZDY).map(d => d.getDate() + '.' + (d.getMonth() + 1));
    expect(dates).toEqual(['9.10', '22.1']);
  });

  it('gives nothing for classes with written dates or without a calendar', () => {
    expect(meetingDates('daty: 05.10 zj.1', 4, ZJAZDY)).toEqual([]);
    expect(meetingDates('zj.1', 4, undefined)).toEqual([]);
  });
});

describe('weekdayOffset', () => {
  it('reads Polish headers with or without diacritics', () => {
    expect(['Poniedziałek', 'Środa', 'Czwartek (01.10)'.split(' ')[0], 'Sobota', 'niedziela', 'Godziny'].map(weekdayOffset))
      .toEqual([0, 2, 3, 5, 6, null]);
  });
});
