'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlanNotes as PlanNotesData } from '@/types/schedule';
import { LOCALES, useLanguage } from '@/i18n';

interface UpcomingExam {
  date: string;
  time_label: string | null;
  subject: string;
  room: string | null;
  form: { kinds: string[]; retake: boolean };
}

interface PlanNotesProps {
  notes?: PlanNotesData | null;
  planId?: string;
  groups?: string[];
}

const INFO_OPEN_KEY = 'planInfoOpen';

// Exams of the current semester (from the plan's Excel) plus, when this year's
// timetable is published, the nearest dates; extra information collapsed below
export const PlanNotes: React.FC<PlanNotesProps> = ({ notes, planId, groups = [] }) => {
  const { lang, t } = useLanguage();
  const [upcoming, setUpcoming] = useState<UpcomingExam[]>([]);
  const [infoOpen, setInfoOpen] = useState(false);
  const groupsKey = groups.join(',');

  useEffect(() => {
    try { setInfoOpen(localStorage.getItem(INFO_OPEN_KEY) === '1'); } catch { /* storage unavailable */ }
  }, []);

  useEffect(() => {
    setUpcoming([]);
    if (!planId) return;
    const params = new URLSearchParams({ plan: planId });
    if (groupsKey) params.set('groups', groupsKey);
    fetch(`/api/exams?${params.toString()}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        // Last year's timetable concerns last year's courses – only show dates
        // here once the current one is published
        if (!d?.available || !d.is_current_year) return;
        const today = d.today || new Date().toISOString().slice(0, 10);
        setUpcoming((d.entries as UpcomingExam[]).filter(e => e.date >= today).slice(0, 3));
      })
      .catch(() => {});
  }, [planId, groupsKey]);

  const toggleInfo = () => {
    setInfoOpen(open => {
      try { localStorage.setItem(INFO_OPEN_KEY, open ? '0' : '1'); } catch { /* storage unavailable */ }
      return !open;
    });
  };

  const subjects = notes?.exams ?? [];
  const info = notes?.info ?? [];

  return (
    <div className="mt-4 space-y-3">
      <section className="glass-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900">{t('notes.exams')}</h3>
          <Link href="/egzaminy"
            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-wspia-red border border-wspia-red/30 hover:bg-wspia-red hover:text-white rounded-full px-3 py-1 transition-colors">
            {t('exams.fullTimetable')} <span aria-hidden="true">→</span>
          </Link>
        </div>

        {subjects.length > 0 ? (
          <div className="mt-3 space-y-2">
            {subjects.map((exam, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-1.5">
                {exam.scope && <span className="text-xs text-wspia-gray mr-1">{exam.scope}:</span>}
                {exam.subjects.map(subject => (
                  <span key={subject} className="text-xs bg-red-50 text-red-800 border border-red-100 rounded-full px-2.5 py-0.5">
                    {subject}
                  </span>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-wspia-gray">{t('exams.noSubjects')}</p>
        )}

        {upcoming.length > 0 && (
          <ul className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
            {upcoming.map((e, i) => (
              <li key={i} className="text-xs text-gray-700 flex gap-2">
                <span className="font-semibold text-gray-900 w-12 shrink-0">
                  {new Date(`${e.date}T12:00:00`).toLocaleDateString(LOCALES[lang], { day: 'numeric', month: 'short' })}
                </span>
                <span className="min-w-0">
                  {e.subject}
                  <span className="text-wspia-gray">{e.time_label && ` · ${e.time_label}`}{e.room && ` · ${e.room}`}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {info.length > 0 && (
        <section className="glass-card overflow-hidden">
          <button type="button" onClick={toggleInfo} aria-expanded={infoOpen}
            className="w-full !bg-transparent hover:!bg-gray-50/60 !border-0 !shadow-none !rounded-none hover:!translate-y-0 flex items-center justify-between px-4 sm:px-5 py-3 text-left">
            <span className="text-sm font-semibold text-gray-900">{t('notes.info')}</span>
            <span className="text-xs text-wspia-gray flex items-center gap-1">
              {infoOpen ? t('notes.showLess') : t('notes.showMore')}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className={`transition-transform ${infoOpen ? 'rotate-180' : ''}`} aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </span>
          </button>
          {infoOpen && (
            <div className="px-4 sm:px-5 pb-4 space-y-3">
              {info.map((block, idx) => (
                <div key={idx}>
                  {block.title && <div className="text-xs text-wspia-gray mb-1">{block.title}</div>}
                  <ul className="space-y-1">
                    {block.items.map((item, i) => (
                      <li key={i} className="text-xs text-gray-700 leading-relaxed">• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
