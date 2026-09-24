'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LOCALES, useLanguage } from '@/i18n';
import { timeSinceUpdate } from '@/i18n/format';

interface ExamEntry {
  date: string;
  time: string | null;
  time_label: string | null;
  subject: string;
  lecturer: string | null;
  form: { label: string; kinds: string[]; retake: boolean };
  room: string | null;
  group: string | null;
  programmes: { faculty: string; degree: string | null }[] | null;
  years: number[] | null;
  modes: string[] | null;
}

interface ExamsResponse {
  available: boolean;
  academic_year?: string;
  is_current_year?: boolean;
  fetched_at?: string;
  source_url?: string;
  today?: string;
  year_offset?: number;
  entries: ExamEntry[];
}

interface Programme {
  faculty: string;
  degree: string;
}

const LAST_SELECTION_KEY = 'lastPlanSelection';
const EXAMS_VIEW_KEY = 'examsView';

const readView = (): { mode?: 'mine' | 'browse'; filters?: { programme: string; year: string; studyMode: string } } => {
  try {
    return JSON.parse(localStorage.getItem(EXAMS_VIEW_KEY) || '{}');
  } catch {
    return {};
  }
};

const readSavedSelection = (): { plan?: string; group?: string; selectedGroups?: string[] } | null => {
  try {
    const raw = localStorage.getItem(LAST_SELECTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const currentAcademicYear = () => {
  const now = new Date();
  const start = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}/${start + 1}`;
};

export default function ExamsPage() {
  const { lang, t } = useLanguage();
  const [mode, setMode] = useState<'mine' | 'browse'>('mine');
  const [saved, setSaved] = useState<ReturnType<typeof readSavedSelection>>(null);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [filters, setFilters] = useState({ programme: '', year: '', studyMode: '' });
  const [data, setData] = useState<ExamsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const [viewRestored, setViewRestored] = useState(false);

  useEffect(() => {
    const selection = readSavedSelection();
    setSaved(selection);
    const view = readView();
    if (view.filters) setFilters(view.filters);
    setMode(!selection?.plan ? 'browse' : view.mode || 'mine');
    setViewRestored(true);
    fetch('/api/exams/faculties').then(r => r.json()).then(d => setProgrammes(d.programmes || [])).catch(() => {});
  }, []);

  // Remember the chosen view in the browser
  useEffect(() => {
    if (!viewRestored) return;
    try { localStorage.setItem(EXAMS_VIEW_KEY, JSON.stringify({ mode, filters })); } catch { /* storage unavailable */ }
  }, [mode, filters, viewRestored]);

  useEffect(() => {
    if (!viewRestored) return;
    const params = new URLSearchParams();
    if (mode === 'mine' && saved?.plan) {
      params.set('plan', saved.plan);
      const groups = saved.selectedGroups?.length ? saved.selectedGroups : saved.group ? [saved.group] : [];
      if (groups.length) params.set('groups', groups.join(','));
    } else if (mode === 'browse') {
      if (filters.programme) {
        const [faculty, degree] = filters.programme.split('|');
        params.set('faculty', faculty);
        params.set('degree', degree);
      }
      if (filters.year) params.set('year', filters.year);
      if (filters.studyMode) params.set('mode', filters.studyMode);
    }
    setLoading(true);
    fetch(`/api/exams?${params.toString()}`)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((d: ExamsResponse) => { setData(d); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [mode, saved, filters, viewRestored]);

  const today = data?.today || new Date().toISOString().slice(0, 10);
  const { upcoming, past } = useMemo(() => {
    const entries = data?.entries || [];
    return {
      upcoming: entries.filter(e => e.date >= today),
      past: entries.filter(e => e.date < today).reverse(),
    };
  }, [data, today]);

  const programmeLabel = (p: Programme) =>
    p.degree === 'II stopnia' ? `${p.faculty} · ${t('exams.secondCycle')}`
      : p.degree === 'jednolite magisterskie' ? `${p.faculty} · ${t('exams.uniform')}` : p.faculty;

  const formLabel = (e: ExamEntry) => {
    const kinds = e.form.kinds.map(k => (k === 'exam' ? t('exams.exam') : k === 'credit' ? t('exams.credit') : t('exams.otherForm')));
    return kinds.join(' / ') + (e.form.retake ? ` · ${t('exams.retake')}` : '');
  };

  const renderDays = (entries: ExamEntry[]) => {
    const byDay: Record<string, ExamEntry[]> = {};
    entries.forEach(e => { (byDay[e.date] = byDay[e.date] || []).push(e); });
    return Object.entries(byDay).map(([day, items]) => {
      const date = new Date(`${day}T12:00:00`);
      const dayLabel = date.toLocaleDateString(LOCALES[lang], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      return (
        <section key={day} className="mb-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            {day === today && <span className="text-xs bg-wspia-red text-white rounded px-1.5 py-0.5">{t('exams.today')}</span>}
            <span className="first-letter:uppercase">{dayLabel}</span>
          </h3>
          <ul className="space-y-2">
            {items.map((e, i) => (
              <li key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex gap-3">
                <div className="w-16 shrink-0 text-sm font-semibold text-gray-900">{e.time_label || '–'}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs rounded-md px-2 py-0.5 border ${e.form.kinds.includes('exam') ? 'bg-red-50 text-red-800 border-red-100' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {formLabel(e)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{e.subject}</span>
                  </div>
                  <div className="text-xs text-wspia-gray mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {e.lecturer && <span>{e.lecturer}</span>}
                    {e.room && <span>{t('exams.room')}: {e.room}</span>}
                    {e.group && <span>{e.group}</span>}
                    {mode === 'browse' && (
                      <span>
                        {e.programmes ? e.programmes.map(p => programmeLabel({ faculty: p.faculty, degree: p.degree || 'I stopnia' })).join(', ') : t('exams.allProgrammes')}
                        {e.years ? ` · ${e.years.map(y => t('exams.yearN', { n: y })).join(', ')}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      );
    });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="text-sm text-wspia-gray hover:text-wspia-red">{t('exams.back')}</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-1">{t('exams.title')}</h1>
        {data?.available && (
          <p className="text-xs text-wspia-gray mb-5">
            {data.academic_year}
            {data.fetched_at && ` · ${t('exams.updated', { ago: timeSinceUpdate(data.fetched_at, lang) })}`}
            {data.source_url && <> · <a href={data.source_url} target="_blank" rel="noopener noreferrer" className="underline">{t('exams.source')}</a></>}
          </p>
        )}

        <div className="flex gap-2 mb-4">
          {(['mine', 'browse'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-sm border ${mode === m ? '!bg-wspia-red hover:!bg-wspia-red !text-white !border-wspia-red' : '!bg-white hover:!bg-gray-50 !text-gray-700 !border-gray-200'}`}>
              {m === 'mine' ? t('exams.myPlan') : t('exams.browse')}
            </button>
          ))}
        </div>

        {mode === 'mine' && !saved?.plan && (
          <p className="text-sm text-wspia-gray mb-4">{t('exams.noSavedPlan')}</p>
        )}

        {mode === 'browse' && (
          <div className="grid gap-2 sm:grid-cols-3 mb-5">
            <label className="text-xs text-wspia-gray">{t('exams.faculty')}
              <select className="mt-1 w-full p-2 border rounded-lg text-sm text-gray-900" value={filters.programme}
                onChange={e => setFilters(f => ({ ...f, programme: e.target.value }))}>
                <option value="">{t('exams.any')}</option>
                {programmes.map(p => (
                  <option key={`${p.faculty}|${p.degree}`} value={`${p.faculty}|${p.degree}`}>{programmeLabel(p)}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-wspia-gray">{t('exams.year')}
              <select className="mt-1 w-full p-2 border rounded-lg text-sm text-gray-900" value={filters.year}
                onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}>
                <option value="">{t('exams.any')}</option>
                {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{t('exams.yearN', { n: y })}</option>)}
              </select>
            </label>
            <label className="text-xs text-wspia-gray">{t('exams.mode')}
              <select className="mt-1 w-full p-2 border rounded-lg text-sm text-gray-900" value={filters.studyMode}
                onChange={e => setFilters(f => ({ ...f, studyMode: e.target.value }))}>
                <option value="">{t('exams.any')}</option>
                <option value="st">{t('selection.categories.st')}</option>
                <option value="nst">{t('selection.categories.nst')}</option>
                <option value="nst_puw">{t('selection.categories.nst_puw')}</option>
              </select>
            </label>
          </div>
        )}

        {data?.available && data.is_current_year === false && (
          <div className="mb-5 text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3">
            {t('exams.previousYear', { current: currentAcademicYear(), year: data.academic_year || '' })}
            {mode === 'mine' && !!data.year_offset && <> {t('exams.previousYearMine', { year: data.academic_year || '' })}</>}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-wspia-gray">{t('common.loading')}</p>
        ) : error ? (
          <p className="text-sm text-red-700">{t('errors.planLoad')}</p>
        ) : !data?.available ? (
          <p className="text-sm text-wspia-gray">{t('exams.unavailable')}</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">
                {t('exams.upcoming')} <span className="text-wspia-gray font-normal">· {t('exams.count', { n: upcoming.length })}</span>
              </h2>
              {past.length > 0 && (
                <button onClick={() => setShowPast(v => !v)} className="!bg-transparent !border-0 !p-0 text-xs text-wspia-gray underline">
                  {showPast ? t('exams.hidePast') : t('exams.showPast', { n: past.length })}
                </button>
              )}
            </div>
            {upcoming.length === 0 && !showPast && <p className="text-sm text-wspia-gray mb-4">{t('exams.empty')}</p>}
            {renderDays(upcoming)}
            {showPast && <div className="opacity-70">{renderDays(past)}</div>}
          </>
        )}
      </div>
    </main>
  );
}
