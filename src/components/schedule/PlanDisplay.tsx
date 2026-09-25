import { useEffect, useRef, useState, useCallback } from 'react';
import { Toggle } from '@/components/ui/Toggle';
import { Plan } from '@/types/schedule';
import { convertTimeToMinutes } from '@/lib/utils';
import { useLanguage, localizeWeekdayHeaders } from '@/i18n';
import { timeSinceUpdate, formatShortDate, formatFullDate } from '@/i18n/format';
import { SuggestionModal } from '@/components/ui/SuggestionModal';
import { sanitizeHtml } from '@/lib/sanitize';

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

const WEEKDAYS = ['poniedzialek', 'wtorek', 'sroda', 'czwartek', 'piatek', 'sobota', 'niedziela'];

/** Offset from Monday (0-6) of a Polish weekday header, null if unknown. */
const weekdayOffset = (name: string): number | null => {
    const key = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/[^a-z]/g, '');
    const i = WEEKDAYS.findIndex(d => key.startsWith(d.slice(0, 4)));
    return i >= 0 ? i : null;
};

/** Meeting numbers from the "zj.2,3,5" lists of a cell. */
const meetingsInCell = (text: string): string[] => {
    const out: string[] = [];
    for (const list of text.matchAll(/zj\.?\s*((?:\d{1,2}\s*[,;]?\s*)+)/gi)) {
        for (const n of list[1].match(/\d{1,2}/g) || []) out.push(String(Number(n)));
    }
    return out;
};

/** Dates ("d.m") from the "daty: 05.10, 12.10" lists of a cell. */
const datesInCell = (text: string): Set<string> => {
    const found = new Set<string>();
    for (const list of text.matchAll(/dat[yae]\s*:?\s*((?:\d{1,2}\.\d{1,2}[\s,;.]*)+)/gi)) {
        for (const [, d, m] of list[1].matchAll(/(\d{1,2})\.(\d{1,2})/g)) found.add(`${Number(d)}.${Number(m)}`);
    }
    return found;
};
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

        // A class is shown when its list of dates contains the column's date;
        // classes without a list of dates (held every week) are always shown
        const keep = (text: string, date: Date | null, source?: string | null) => {
            const zjazdy = (source && plan.zjazdyBySource?.[source]) || plan.zjazdy;
            if (!date) return true;
            const dates = datesInCell(text);
            if (dates.size) return dates.has(`${date.getDate()}.${date.getMonth() + 1}`);
            // "zj.2,3,5": meeting numbers, dated by the programme's meeting calendar.
            // Matched by week - on-line classes may fall on a day the calendar omits (Thursday)
            const meetings = meetingsInCell(text);
            // a sheet of a single meeting ("zj.5") lists no numbers in its cells
            const own = source ? plan.meetingBySource?.[source] : plan.meeting;
            if (!meetings.length && own) meetings.push(own);
            if (meetings.length && zjazdy) {
                const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const from = iso(weekRange.start), to = iso(weekRange.end);
                return meetings.some(n => (zjazdy[n] || []).some(day => day >= from && day <= to));
            }
            return true;
        };

        let hasAnyLessonsInWeek = false;
        for (let i = 1; i < rows.length; i++) {
            rows[i].querySelectorAll('td').forEach((cell, index) => {
                if (index === 0 || !cell.textContent?.trim()) return;
                const date = columnDates[index] ?? null;
                // Merged plans (group + on-line lectures, group + specialisation) hold
                // several classes in one cell - each is judged on its own dates
                const blocks = cell.querySelectorAll('[data-merge-block]');
                if (blocks.length) {
                    blocks.forEach(b => { if (!keep(b.textContent || '', date, b.getAttribute('data-merge-source'))) b.remove(); });
                    if (!cell.querySelector('[data-merge-block]')) cell.innerHTML = '';
                } else if (!keep(cell.textContent || '', date)) {
                    cell.innerHTML = '';
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
        
        // First pass: Make subject names bold
        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, cellIndex) => {
                if (cellIndex !== 0) { // Skip first column (time)
                    cell.innerHTML = cell.innerHTML.replace(
                        /^(.+?)\s+[-–]\s+/,
                        '<strong class="text-wspia-gray">$1</strong><br/>'
                    );
                }
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

        // Second pass: Merge cells vertically if enabled
        if (mergeEnabled) {
            for (let colIndex = 1; colIndex <= 5; colIndex++) {
                let currentContent = '';
                let startRow = 0;
                let spanCount = 0;

                for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
                    const currentCell = rows[rowIndex].cells[colIndex];
                    if (!currentCell) continue;

                    const cellContent = currentCell.innerHTML.trim();

                    if (cellContent === currentContent && currentContent !== '') {
                        currentCell.style.display = 'none';
                        spanCount++;
                        
                        const firstCell = rows[startRow].cells[colIndex];
                        if (firstCell) {
                            firstCell.rowSpan = spanCount + 1;
                        }
                    } else {
                        currentContent = cellContent;
                        startRow = rowIndex;
                        spanCount = 0;
                    }
                }
            }
        }

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
    const updatePlanContent = useCallback(() => {
        let processedHtml = processHtml(plan.html);
        
        if (currentWeek && filterEnabled) {
            processedHtml = filterPlanForCurrentWeek(processedHtml, currentWeek);
        }
        
        setFilteredHtml(localizeWeekdayHeaders(processedHtml, lang));
    }, [plan.html, plan.category, currentWeek, filterEnabled, processHtml, filterPlanForCurrentWeek, lang]);

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
                    if (dayCell && dayCell.textContent?.trim() && dayCell.innerHTML.trim() !== "&nbsp;") {
                        // Only highlight non-empty cells
                        dayCell.classList.add('current-time-highlight');
                        currentHighlightRef.current = dayCell;
                        currentSlot = dayCell.textContent?.trim() || null;
                        
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
                {filterEnabled && !plan.zjazdy && !Object.values(plan.zjazdyBySource || {}).some(Boolean)
                    && /zj\.?\s*\d/i.test(plan.html || '') && (
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
