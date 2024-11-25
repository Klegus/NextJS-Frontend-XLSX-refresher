import { useEffect, useRef, useState } from 'react';
import { Toggle } from '@/components/ui/Toggle';
import { Plan } from '@/types/schedule';
import { timeSinceUpdate, convertTimeToMinutes } from '@/lib/utils';

interface PlanDisplayProps {
  plan: Plan;
  currentWeek?: {
    start: Date;
    end: Date;
  };
  onTimeSlotChange?: (current: string | null, next: string | null) => void;
}

interface PlanStatus {
  isOnline: boolean;
  lastChecked: Date;
}

const FILTER_TOGGLE_KEY = 'planFilterEnabled';

export const PlanDisplay: React.FC<PlanDisplayProps> = ({
    plan,
    currentWeek,
    onTimeSlotChange
}) => {
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

    const filterPlanForCurrentWeek = (html: string, weekRange: { start: Date; end: Date }) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const table = doc.querySelector('table');
        
        if (!table) return html;

        const rows = table.querySelectorAll('tr');
        const headerRow = rows[0];
        const headerCells = headerRow.querySelectorAll('th');

        // Aktualizuj nagłówki z datami
        headerCells.forEach((cell, index) => {
            if (index > 0 && index <= 5) { // Tylko dla dni roboczych (pon-pt)
                const date = new Date(weekRange.start);
                date.setDate(weekRange.start.getDate() + (index - 1));
                const originalText = cell.textContent?.split('(')[0].trim() || '';
                const formattedDate = date.toLocaleDateString('pl-PL', { 
                    day: '2-digit',
                    month: '2-digit'
                });
                cell.textContent = `${originalText} (${formattedDate})`;
            }
        });

        // Filtruj wiersze z lekcjami
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.querySelectorAll('td');
            let hasLessonsInWeek = false;

            cells.forEach((cell, index) => {
                if (index === 0) return; // Pomijamy kolumnę z godzinami
                if (index > 5) { // Ukryj kolumny po piątku
                    cell.style.display = 'none';
                    return;
                }

                const cellContent = cell.innerHTML;
                if (cellContent && cellContent.trim() !== '') {
                    const date = new Date(weekRange.start);
                    date.setDate(weekRange.start.getDate() + (index - 1));
                    const dateStr = date.toLocaleDateString('pl-PL', {
                        day: '2-digit',
                        month: '2-digit'
                    });

                    if (!cellContent.includes(dateStr)) {
                        cell.innerHTML = '';
                    } else {
                        hasLessonsInWeek = true;
                    }
                }
            });

            if (!hasLessonsInWeek) {
                row.style.display = 'none';
            }
        }

        return table.outerHTML;
    };

    useEffect(() => {
        // Process HTML to make subject names bold
        const parser = new DOMParser();
        const doc = parser.parseFromString(plan.html, 'text/html');
        const table = doc.querySelector('table');
        
        if (table) {
            const rows = table.querySelectorAll('tr');
            rows.forEach((row, rowIndex) => {
                const cells = row.querySelectorAll('td');
                cells.forEach((cell, cellIndex) => {
                    if (cellIndex !== 0) { // Skip first column (time)
                        cell.innerHTML = cell.innerHTML.replace(
                            /^([^-]+?)(?=-)(-)/,
                            '<strong class="text-wspia-gray">$1</strong><br/>'
                        );
                    }
                });
            });
            
            const processedHtml = table.outerHTML;
            
            if (plan.category === 'st' && currentWeek && filterEnabled) {
                const filtered = filterPlanForCurrentWeek(processedHtml, currentWeek);
                setFilteredHtml(filtered);
            } else {
                setFilteredHtml(processedHtml);
            }
        } else {
            setFilteredHtml(plan.html);
        }
    }, [plan, currentWeek, filterEnabled]);

    const handleFilterToggle = () => {
        const newValue = !filterEnabled;
        setFilterEnabled(newValue);
        localStorage.setItem(FILTER_TOGGLE_KEY, String(newValue));
    };

    useEffect(() => {
        const highlightCurrentTimeSlot = () => {
            if (!containerRef.current) return;

            const now = new Date();
            const currentDay = now.getDay();
            const currentTime = now.getHours() * 60 + now.getMinutes();

            console.log('Current day:', currentDay); // 1-5 dla pon-pt
            console.log('Current time (in minutes):', currentTime);

            const table = containerRef.current.querySelector('table');
            if (!table) return;

            // Remove previous highlights
            table.querySelectorAll('.current-time-highlight').forEach(el => {
                el.classList.remove('current-time-highlight');
            });

            // Skip weekends regardless of category
            if (currentDay === 0 || currentDay === 6) {
                onTimeSlotChange?.("Weekend! Czas wolny od zajęć 🎉", null);
                return;
            }

            // Find current time slot
            const rows = table.querySelectorAll('tr');
            let currentSlot = null;
            let found = false;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (found) break;
                if (i === 0) continue; // Skip header row

                const cells = row.querySelectorAll('td');
                if (cells.length === 0) continue;

                // Skip first column (time column)
                const timeCell = cells[0];
                if (!timeCell) continue;

                const timeParts = timeCell.textContent?.trim().split('-') || [];
                if (timeParts.length !== 2) continue;

                const startTime = convertTimeToMinutes(timeParts[0]);
                const endTime = convertTimeToMinutes(timeParts[1]);

                console.log('Checking time slot:', {
                    timeCell: timeCell.textContent,
                    startTime,
                    endTime,
                    currentTime,
                    isInTimeSlot: currentTime >= startTime && currentTime < endTime
                });

                if (currentTime >= startTime && currentTime < endTime) {
                    console.log('Found matching time slot!', {
                        row: i,
                        timeSlot: timeCell.textContent,
                        dayCell: row.cells[currentDay]?.textContent
                    });
                    const dayCell = row.cells[currentDay];
                    if (dayCell) {
                        dayCell.classList.add('current-time-highlight');
                        currentSlot = dayCell.textContent || null;
                    
                        // Scroll to the highlighted cell with smooth animation
                        dayCell.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                            inline: 'center'
                        });
                        found = true;
                        break;
                    }
                }
            }

            onTimeSlotChange?.(currentSlot, null);
        };

        highlightCurrentTimeSlot();
        const interval = setInterval(highlightCurrentTimeSlot, 60000);

        return () => clearInterval(interval);
    }, [plan, currentWeek, onTimeSlotChange]);

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
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div 
                            className={`w-2 h-2 rounded-full ${status.isOnline ? 'bg-green-500' : 'bg-red-500'}`} 
                            title={`Status: ${status.isOnline ? 'Online' : 'Offline'}`} 
                        />
                        <h2 className="text-xl sm:text-2xl font-bold text-wspia-gray">Plan zajęć</h2>
                    </div>
                    {plan.category === 'st' && (
                        <div className="flex items-center gap-2">
                            <Toggle
                                checked={filterEnabled}
                                onChange={handleFilterToggle}
                                label="Filtruj plan"
                            />
                            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                                Filtruj plan
                            </span>
                        </div>
                    )}
                </div>
                <span className="text-sm text-gray-500 whitespace-nowrap">
                    Ostatnia aktualizacja: {timeSinceUpdate(plan.timestamp)}
                </span>
            </div>

            <div className="overflow-x-auto">
                <div
                    ref={containerRef}
                    className="relative min-w-[800px] lg:min-w-0 [&_.current-time-highlight]:bg-wspia-blue/10 [&_.current-time-highlight]:text-wspia-blue"
                    id="plan-content"
                    dangerouslySetInnerHTML={{ __html: filteredHtml }}
                />
            </div>
        </div>
    );
};
