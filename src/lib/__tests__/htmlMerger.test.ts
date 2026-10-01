// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mergeHTMLTables } from '@/lib/htmlMerger';

const sheet = (fri: string) =>
  `<table><tr><th><b>Godziny</b></th><th><b>Piątek</b></th></tr><tr><td>8<sup>15</sup> - 9<sup>00</sup></td><td>${fri}</td></tr></table>`;
const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

describe('mergeHTMLTables', () => {
  it('marks a real conflict between the student\'s own groups', () => {
    const doc = parse(mergeHTMLTables({ 'Grupa 1': sheet('Algebra - wykład'), 'Sp.: Bazy': sheet('Bazy - lab') }));
    const td = doc.querySelectorAll('td')[1] as HTMLTableCellElement;
    expect(td.style.backgroundColor).not.toBe('');
    expect(td.textContent).toContain('[Grupa 1]');
    expect(doc.body.textContent).toContain('Grupa 1');
  });

  it('does not label or colour sheets of a plan published in parts', () => {
    const doc = parse(mergeHTMLTables(
      { 'zjazd 3': sheet('Chirurgia - ćwiczenia'), 'zajęcia on-line': sheet('Interna - wykład zj.1') },
      undefined, { independent: ['zjazd 3', 'zajęcia on-line'] }));
    const td = doc.querySelectorAll('td')[1] as HTMLTableCellElement;
    expect(td.style.backgroundColor).toBe('');
    expect(td.textContent).not.toContain('[');
    expect(doc.querySelectorAll('[data-merge-block]')).toHaveLength(2);
    expect([...doc.querySelectorAll('[data-merge-block]')].map(b => b.getAttribute('data-merge-source')))
      .toEqual(['zjazd 3', 'zajęcia on-line']);
  });

  it('escapes source names', () => {
    const doc = parse(mergeHTMLTables({ '<img src=x onerror=alert(1)>': sheet('A - wykład'), 'B': sheet('B - wykład') }));
    expect(doc.querySelector('img')).toBeNull();
    expect(doc.body.textContent).toContain('<img src=x onerror=alert(1)>'); // shown as text
  });
});
