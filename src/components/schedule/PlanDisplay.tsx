import { useEffect, useRef, useState, useCallback } from 'react';
import { Toggle } from '@/components/ui/Toggle';
import { Plan } from '@/types/schedule';
import { convertTimeToMinutes } from '@/lib/utils';
import { useLanguage, localizeWeekdayHeaders } from '@/i18n';
import { timeSinceUpdate, formatShortDate, formatFullDate } from '@/i18n/format';
import { SuggestionModal } from '@/components/ui/SuggestionModal';
import { sanitizeHtml } from '@/lib/sanitize';
import { hasMeetingNumbers } from '@/lib/meetings';
import { weekdayOffset, meetingsInCell, datesInCell, heldOn, meetingDates, lessonsOf, sourceOf, boldSubject } from '@/lib/schedule';

interface PlanDisplayProps {
  plan: Plan;
  currentWeek?: {
    start: Date;
    end: Date;
  };
  onTimeSlotChange?: (current: string | null, next: string | null) => void;
  onFilterToggle?: (isEnabled: boolean) => void;
  onMergeToggle?: (isEnabled: boolean) => void;
}

interface PlanStatus {
  isOnline: boolean;
  lastChecked: Date;
}

const FILTER_TOGGLE_KEY = 'planFilterEnabled';

const MERGE_TOGGLE_KEY = 'planMergeEnabled';

export const PlanDisplay: React.FC<PlanDisplayProps> = ({
    plan,
    currentWeek,
    onTimeSlotChange,
    onFilterToggle,
    onMergeToggle
}) => {
    const { t, lang } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const [filteredHtml, setFilteredHtml] = useState(plan.html);
    const [status, setStatus] = useState<PlanStatus>({ isOnline: true, lastChecked: new Date() });
    const [filterEnabled, setFilterEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(FILTER_TOGGLE_KEY);
            return saved !== null ? saved === 'true' : true;
        }
        return true;
    });

    const [mergeEnabled, setMergeEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(MERGE_TOGGLE_KEY);
            return saved !== null ? saved === 'true' : true;
        }
        return true;
    });
    
    // Lecturers' names arrive already in the right form: full with SSO sign-in,
    // shortened on the server in public mode (see lib/access.ts)

    // Dodajemy stan dla modalu sugestii
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);

    // Plan lists meeting numbers but no calendar of them was found: the week filter
    // cannot tell the weeks apart, so the whole plan is shown instead of guessing
    const hasCalendar = !!plan.zjazdy || Object.values(plan.zjazdyBySource || {}).some(Boolean);
    const noMeetingCalendar = !hasCalendar && hasMeetingNumbers(plan.html || '');

    // Whole semester view: classes listed by meeting numbers get their dates
    const addMeetingDates = (html: string) => {
        if (!hasCalendar) return html;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const table = doc.querySelector('table');
        if (!table) return html;
        const offsets = [...table.querySelectorAll('tr:first-child th')]
            .map(th => weekdayOffset((th.textContent || '').split('(')[0].trim()));
        table.querySelectorAll('tr').forEach(row => row.querySelectorAll('td').forEach((cell, index) => {
            const weekday = offsets[index];
            if (index === 0 || weekday === null || weekday === undefined) return;
            lessonsOf(cell).forEach(lesson => {
                const source = sourceOf(lesson);
                const dates = meetingDates(lesson.textContent || '', weekday,
                    (source && plan.zjazdyBySource?.[source]) || plan.zjazdy,
                    source ? plan.meetingBySource?.[source] : plan.meeting);
                if (!dates.length) return;
                const line = doc.createElement('div');
                line.className = 'text-xs text-ink-muted mt-0.5';
                line.textContent = `${t('plan.lessonDates')}: ${dates.map(d => formatShortDate(d, lang)).join(', ')}`;
                lesson.appendChild(line);
            });
        }));
        return doc.body.innerHTML;
    };

    const filterPlanForCurrentWeek = (html: string, weekRange: { start: Date; end: Date }) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const table = doc.querySelector('table');

        if (!table) return html;

        const rows = table.querySelectorAll('tr');
        const headerCells = rows[0].querySelectorAll('th');

        // Weekday of every column comes from its header (plans have Mon-Fri, Thu-Sun,
        // Fri-Sun or Mon-Sun columns), never from the column position
        const columnDates: (Date | null)[] = [];
        headerCells.forEach((cell, index) => {
            if (index === 0) return;
            const name = (cell.textContent || '').split('(')[0].trim();
            const offset = weekdayOffset(name);
            if (offset === null) {
                columnDates[index] = null;
                return;
            }
            const date = new Date(weekRange.start);
            date.setDate(weekRange.start.getDate() + offset);
            columnDates[index] = date;
            cell.textContent = `${name} (${formatShortDate(date, lang)})`;
        });

        // Sheets of weekend / part-time meetings: most classes list meeting numbers or dates.
        // A class there without either cannot be placed in a week, so the week view leaves
        // it out (the whole-semester view still shows it)
        const counts = new Map<string | null, { dated: number; all: number }>();
        rows.forEach((row, i) => i > 0 && row.querySelectorAll('td').forEach((cell, index) => {
            if (index === 0) return;
            lessonsOf(cell).forEach(u => {
                const text = u.textContent || '';
                if (!text.trim()) return;
                const source = sourceOf(u);
                const c = counts.get(source) || { dated: 0, all: 0 };
                const own = source ? plan.meetingBySource?.[source] : plan.meeting;
                c.all++;
                if (own || datesInCell(text).size || meetingsInCell(text).length) c.dated++;
                counts.set(source, c);
            });
        }));
        const meetingSheet = (source: string | null) => {
            const c = counts.get(source);
            const zjazdy = (source && plan.zjazdyBySource?.[source]) || plan.zjazdy;
            return !!zjazdy && !!c && c.dated * 2 >= c.all;
        };

        // A class is shown when its list of dates contains the column's date;
        // classes without a list of dates (held every week) are always shown
        const keep = (text: string, date: Date | null, source?: string | null) => {
            if (!date) return true;
            const own = source ? plan.meetingBySource?.[source] : plan.meeting;
            if (!own && !datesInCell(text).size && !meetingsInCell(text).length && meetingSheet(source ?? null)) return false;
            return heldOn(text, date, (source && plan.zjazdyBySource?.[source]) || plan.zjazdy, own);
        };

        let hasAnyLessonsInWeek = false;
        for (let i = 1; i < rows.length; i++) {
            rows[i].querySelectorAll('td').forEach((cell, index) => {
                if (index === 0 || !cell.textContent?.trim()) return;
                const date = columnDates[index] ?? null;
                // Merged plans (group + on-line lectures, group + specialisation) hold
                // several classes in one cell - each is judged on its own dates
                // and a cell may hold several classes - each is judged on its own dates
                const units = lessonsOf(cell);
                if (units[0] === cell) {
                    if (!keep(cell.textContent || '', date, null)) cell.innerHTML = '';
                } else {
                    const withLessons = [...cell.querySelectorAll('[data-merge-block]')].filter(b => b.querySelector('[data-lesson]'));
                    units.forEach(u => { if (!keep(u.textContent || '', date, sourceOf(u))) u.remove(); });
                    withLessons.forEach(b => { if (!b.querySelector('[data-lesson]')) b.remove(); });
                    if (!cell.querySelector('[data-merge-block], [data-lesson]')) cell.innerHTML = '';
                }
                if (cell.textContent?.trim()) hasAnyLessonsInWeek = true;
            });
        }

        // Jeśli nie ma żadnych zajęć w tym tygodniu, zwróć komunikat
        if (!hasAnyLessonsInWeek) {
            const weekStartStr = formatFullDate(weekRange.start, lang);
            const weekEndStr = formatFullDate(weekRange.end, lang);

            return `
                <div class="flex flex-col items-center justify-center py-16 px-4">
                    <div class="text-6xl mb-4">📚</div>
                    <h2 class="text-2xl font-bold text-gray-700 mb-2">${t('plan.noLessonsTitle')}</h2>
                    <p class="text-gray-500 text-center max-w-md">
                        ${t('plan.noLessonsText', { start: weekStartStr, end: weekEndStr })}
                    </p>
                    <p class="text-sm text-gray-400 mt-4">
                        ${t('plan.noLessonsHint')}
                    </p>
                </div>
            `;
        }

        return table.outerHTML;
    };

    const processHtml = (htmlContent: string) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const table = doc.querySelector('table');
        
        if (!table) return htmlContent;

        const rows = table.querySelectorAll('tr');
        
        // First pass: Make subject names bold (every class of a cell)
        rows.forEach(row => {
            row.querySelectorAll('td').forEach((cell, cellIndex) => {
                if (cellIndex !== 0) lessonsOf(cell).forEach(boldSubject); // Skip first column (time)
            });
        });

        // Reset all merged cells
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                cell.style.display = '';
                cell.removeAttribute('rowspan');
            });
        });

        return table.outerHTML;
    };

    const handleFilterToggle = () => {
        const newValue = !filterEnabled;
        setFilterEnabled(newValue);
        if (typeof window !== 'undefined') {
            localStorage.setItem(FILTER_TOGGLE_KEY, String(newValue));
        }
        onFilterToggle?.(newValue);
    };

    const handleMergeToggle = () => {
        const newValue = !mergeEnabled;
        setMergeEnabled(newValue);
        if (typeof window !== 'undefined') {
            localStorage.setItem(MERGE_TOGGLE_KEY, String(newValue));
        }
        onMergeToggle?.(newValue);
    };

    // Funkcja do odświeżania zawartości planu
    // Same class in consecutive hours of a day -> one tall cell. Done last, on what is
    // actually shown (after the week filter), for every day column (Mon-Sat, Thu-Sun, ...)
    const mergeVertically = (html: string) => {
        if (!mergeEnabled) return html;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const table = doc.querySelector('table');
        if (!table) return html;
        const rows = [...table.querySelectorAll('tr')];
        const columns = rows[0]?.children.length || 0;
        for (let col = 1; col < columns; col++) {
            let first: HTMLTableCellElement | null = null;
            let content = '';
            for (let r = 1; r < rows.length; r++) {
                const cell = rows[r].cells[col];
                if (!cell) continue;
                // compared as text: after the filter the same class may or may not sit in a <div data-lesson>
                const html = (cell.textContent || '').replace(/\s+/g, ' ').trim();
                if (first && html && html === content) {
                    cell.style.display = 'none';
                    first.rowSpan += 1;
                } else {
                    first = cell;
                    content = html;
                }
            }
        }
        return doc.body.innerHTML;
    };

    const updatePlanContent = useCallback(() => {
        let processedHtml = processHtml(plan.html);
        
        if (currentWeek && filterEnabled && !noMeetingCalendar) {
            processedHtml = filterPlanForCurrentWeek(processedHtml, currentWeek);
        } else {
            processedHtml = addMeetingDates(processedHtml);
        }
        processedHtml = mergeVertically(processedHtml);
        
        setFilteredHtml(localizeWeekdayHeaders(processedHtml, lang));
    }, [plan.html, plan.category, currentWeek, filterEnabled, mergeEnabled, noMeetingCalendar, processHtml, filterPlanForCurrentWeek, addMeetingDates, lang]);

    // Efekt dla aktualizacji planu gdy zmienia się status cenzury lub inne stany
    useEffect(() => {
        updatePlanContent();
    }, [filterEnabled, mergeEnabled, plan, currentWeek, updatePlanContent]);

    const currentHighlightRef = useRef<HTMLTableCellElement | null>(null);

    useEffect(() => {
        const highlightCurrentTimeSlot = () => {
            if (!containerRef.current) return;
    
            // Użyj czasu warszawskiego zamiast lokalnego
            const warsawDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }));
            const currentDay = warsawDate.getDay();
            const currentTime = warsawDate.getHours() * 60 + warsawDate.getMinutes();
    
            const table = containerRef.current.querySelector('table');
            if (!table) return;
    
            // Today's column from the (Polish) day headers of the plan - weekend studies
            // have Thu-Sun or Fri-Sun columns, so the column is not getDay()
            const headerDoc = new DOMParser().parseFromString(plan.html || '', 'text/html');
            const offsets = [...headerDoc.querySelectorAll('tr:first-child th')]
                .map(th => weekdayOffset((th.textContent || '').split('(')[0].trim()));
            const todayColumn = offsets.indexOf((currentDay + 6) % 7);
            if (todayColumn < 1) {
                onTimeSlotChange?.(currentDay === 0 || currentDay === 6 ? t('plan.weekend') : null, null);
                return;
            }
    
            // Remove highlight from previous cell
            if (currentHighlightRef.current) {
                currentHighlightRef.current.classList.remove('current-time-highlight');
                currentHighlightRef.current = null;
            }
    
            // Find current time slot
            const rows = table.querySelectorAll('tr');
            let currentSlot: string | null = null;
    
            for (let i = 1; i < rows.length; i++) {
                const cells = rows[i].querySelectorAll('td');
                if (cells.length === 0) continue;
    
                const timeCell = cells[0];
                if (!timeCell) continue;
    
                const timeParts = timeCell.textContent?.trim().split('-') || [];
                if (timeParts.length !== 2) continue;
    
                const startTime = convertTimeToMinutes(timeParts[0]);
                const endTime = convertTimeToMinutes(timeParts[1]);
    
                if (currentTime >= startTime && currentTime < endTime) {
                    const dayCell = rows[i].cells[todayColumn];
                    // only classes held today - plans that list dates or meetings show
                    // every date in the cell when the week filter is off
                    const held = (dayCell ? lessonsOf(dayCell) : [])
                        .filter(el => {
                            const source = sourceOf(el);
                            return el.textContent?.trim() && heldOn(el.textContent, warsawDate,
                                (source && plan.zjazdyBySource?.[source]) || plan.zjazdy,
                                source ? plan.meetingBySource?.[source] : plan.meeting, true);
                        })
                        .map(el => (el.textContent || '').replace(/^\s*\[[^\]]*\]\s*/, '').trim());
                    if (dayCell && held.length && dayCell.innerHTML.trim() !== "&nbsp;") {
                        // Only highlight non-empty cells
                        dayCell.classList.add('current-time-highlight');
                        currentHighlightRef.current = dayCell;
                        currentSlot = held.join(' · ');
                        
                        // Automatically center the view on non-empty cells
                        dayCell.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                            inline: 'center'
                        });
                        break;
                    }
                }
            }
    
            // Send current slot info even if empty
            onTimeSlotChange?.(currentSlot, null);
        };

        // Initial highlight with a small delay to ensure DOM is ready
        const initialTimeout = setTimeout(highlightCurrentTimeSlot, 100);
        
        // Set up interval for updates
        const interval = setInterval(highlightCurrentTimeSlot, 60000);

        // Cleanup function
        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
            if (currentHighlightRef.current) {
                currentHighlightRef.current.classList.remove('current-time-highlight');
                currentHighlightRef.current = null;
            }
        };
    }, [plan, currentWeek, t]);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch('/api/status');
                setStatus({
                    isOnline: response.ok,
                    lastChecked: new Date()
                });
            } catch (error) {
                setStatus(prev => ({
                    isOnline: false,
                    lastChecked: new Date()
                }));
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 10000);
        return () => clearInterval(interval);
    }, [plan.category, plan.id]);

    return (
        <div className="p-4 sm:p-5">
            {/* Controls bar */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-1.5 mr-auto">
                    <div
                        className={`w-1.5 h-1.5 rounded-full ${status.isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}
                        title={status.isOnline ? t('plan.online') : t('plan.offline')}
                    />
                    <span className="text-xs text-ink-muted">
                        {timeSinceUpdate(plan.timestamp, lang)}
                    </span>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer">
                    <Toggle
                        checked={filterEnabled}
                        onChange={handleFilterToggle}
                        label={t('plan.filterWeek')}
                    />
                    <span className="text-xs text-ink-muted select-none">{t('plan.filterWeek')}</span>
                </label>
                {filterEnabled && noMeetingCalendar && (
                    <span className="text-xs text-amber-700">{t('plan.noMeetingCalendar')}</span>
                )}

                <label className="flex items-center gap-1.5 cursor-pointer">
                    <Toggle
                        checked={mergeEnabled}
                        onChange={handleMergeToggle}
                        label={t('plan.mergeCells')}
                    />
                    <span className="text-xs text-ink-muted select-none">{t('plan.mergeCells')}</span>
                </label>

            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <div
                    ref={containerRef}
                    className="relative min-w-[800px] lg:min-w-0"
                    id="plan-content"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(filteredHtml) }}
                />
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                <button
                    onClick={() => setShowSuggestionModal(true)}
                    className="px-3 py-1.5 text-xs"
                >
                    {t('plan.suggest')}
                </button>
            </div>

            <SuggestionModal
                isOpen={showSuggestionModal}
                onClose={() => setShowSuggestionModal(false)}
            />
        </div>
    );
};
