'use client';

import { useState, useEffect } from 'react';

interface ChangeDetail {
  field: string;
  label: string;
  old?: string;
  new?: string;
  added?: string[];
  removed?: string[];
}

interface Change {
  type: 'added' | 'removed' | 'changed';
  group: string;
  day: string;
  time: string;
  subject: string;
  details: string;
  changes?: ChangeDetail[];
}

interface ChangeReport {
  timestamp: string;
  plan_name: string;
  change_count: number;
  summary: string;
  changes: Change[];
}

interface PlanChangesProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: string;  // collection name to filter by
  groupName?: string; // group to highlight
}

export const PlanChanges: React.FC<PlanChangesProps> = ({ isOpen, onClose, planId, groupName }) => {
  const [reports, setReports] = useState<ChangeReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const params = new URLSearchParams({ limit: '20' });
      if (planId) params.set('collection', planId);
      fetch(`/api/changes?${params}`)
        .then(r => r.json())
        .then(data => {
          setReports(data.changes || []);
        })
        .catch(() => setReports([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const typeIcon = (type: string) => {
    switch (type) {
      case 'added': return '+';
      case 'removed': return '-';
      case 'changed': return '~';
      default: return '?';
    }
  };

  const typeBg = (type: string) => {
    switch (type) {
      case 'added': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'removed': return 'bg-red-50 text-red-700 border-red-200';
      case 'changed': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-glass-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-ink">Historia zmian</h2>
            <p className="text-xs text-ink-muted mt-0.5">Ostatnie wykryte zmiany w planach zajęć</p>
          </div>
          <button
            onClick={onClose}
            className="!bg-transparent !border-none !shadow-none w-8 h-8 flex items-center justify-center text-ink-muted hover:text-ink !p-0"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading && (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-wspia-red border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && reports.length === 0 && (
            <div className="text-center py-12 text-ink-muted text-sm">
              Brak wykrytych zmian w planach.
            </div>
          )}

          {!loading && reports.map((report, idx) => (
            <div key={idx} className="mb-4 last:mb-0">
              {/* Report header */}
              <button
                onClick={() => setExpandedReport(expandedReport === idx ? null : idx)}
                className="!bg-gray-50 !border-gray-200 w-full text-left px-4 py-3 rounded-xl flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-ink-muted">{formatDate(report.timestamp)}</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.6875rem] font-semibold bg-wspia-red/10 text-wspia-red">
                      {report.change_count} {report.change_count === 1 ? 'zmiana' : report.change_count < 5 ? 'zmiany' : 'zmian'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-ink truncate">{report.plan_name}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{report.summary}</p>
                </div>
                <span className="text-ink-muted text-xs shrink-0 mt-1">
                  {expandedReport === idx ? '▲' : '▼'}
                </span>
              </button>

              {/* Expanded changes */}
              {expandedReport === idx && (
                <div className="mt-2 space-y-1.5 pl-2">
                  {report.changes.map((change, ci) => (
                    <div key={ci} className={`rounded-lg border px-3 py-2 text-xs ${typeBg(change.type)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-sm">{typeIcon(change.type)}</span>
                        <span className="font-semibold">{change.subject}</span>
                      </div>
                      <div className="flex gap-3 text-[0.6875rem] opacity-80 mb-1">
                        <span>{change.day}</span>
                        <span>{change.time}</span>
                        <span className={`${change.group === groupName ? 'font-semibold opacity-100' : 'opacity-60'}`}>
                          {change.group}
                          {change.group === groupName && ' (Twoja grupa)'}
                        </span>
                      </div>

                      {change.changes && change.changes.map((detail, di) => (
                        <div key={di} className="mt-1 pl-5 text-[0.6875rem]">
                          <span className="font-medium">{detail.label}: </span>
                          {detail.old && detail.new && (
                            <span>
                              <span className="line-through opacity-60">{detail.old}</span>
                              {' → '}
                              <span className="font-semibold">{detail.new}</span>
                            </span>
                          )}
                          {detail.added && detail.added.length > 0 && (
                            <span className="text-emerald-700"> +{detail.added.join(', ')}</span>
                          )}
                          {detail.removed && detail.removed.length > 0 && (
                            <span className="text-red-700"> -{detail.removed.join(', ')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
