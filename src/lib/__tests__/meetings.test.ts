import { describe, expect, it } from 'vitest';
import { parseMeetings, hasMeetingNumbers } from '@/lib/meetings';

// every notation below was found in the university's sheets
describe('parseMeetings', () => {
  it.each([
    ['zj.2,3,5 sala', ['2', '3', '5']],
    ['zj. 9, 10\n', ['9', '10']],
    ['zj 3,9', ['3', '9']],
    ['zj..2,3,8,10,11,12\n', ['2', '3', '8', '10', '11', '12']],
    ['zj,1,2,3', ['1', '2', '3']],
    ['zj.8.9\n', ['8', '9']],
    ['zj. 12. sala', ['12']],
    ['zj.5,7\n+4', ['5', '7']],
    ['zj.1 +5 h', ['1']],
    ['zj.2,3,5,8,9, 10,11,12,13,14\n', ['2', '3', '5', '8', '9', '10', '11', '12', '13', '14']],
    ['zj.10 w godz. 7:25-14:15 zj.11 w godz. 8:15', ['10', '11']],
    ['zj.0,1,2', ['0', '1', '2']],
  ])('%j -> %j', (text, meetings) => {
    expect(parseMeetings(text).meetings).toEqual(meetings);
  });

  it('reads dates written after zj. as dates, not meetings', () => {
    const r = parseMeetings('Dietetyka - ćwiczenia zj. 17.11, 15.12 sala');
    expect(r.meetings).toEqual([]);
    expect([...r.dates]).toEqual(['17.11', '15.12']);
  });

  it('does not take words like "zjazd" or labels for meeting lists', () => {
    expect(parseMeetings('zjazdy on-line 3').meetings).toEqual([]);
    expect(parseMeetings('[zjazd 5] foo zj.5').meetings).toEqual(['5']);
    expect(hasMeetingNumbers('Programowanie - wykład sala 12')).toBe(false);
  });
});
