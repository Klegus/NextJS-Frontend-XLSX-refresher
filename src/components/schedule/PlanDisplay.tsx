import { useEffect, useRef, useState } from 'react';
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

export const PlanDisplay: React.FC<PlanDisplayProps> = ({
    plan,
    currentWeek,
    onTimeSlotChange
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [filteredHtml, setFilteredHtml] = useState(plan.html);

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
        if (plan.category === 'st' && currentWeek) {
            const filtered = filterPlanForCurrentWeek(plan.html, currentWeek);
            setFilteredHtml(filtered);
        } else {
            setFilteredHtml(plan.html);
        }
    }, [plan, currentWeek]);

    useEffect(() => {
        const highlightCurrentTimeSlot = () => {
            if (!containerRef.current) return;

            const now = new Date();
            const currentDay = now.getDay();
            const currentTime = now.getHours() * 60 + now.getMinutes();

            const table = containerRef.current.querySelector('table');
            if (!table) return;

            // Remove previous highlights
            table.querySelectorAll('.current-time-highlight').forEach(el => {
                el.classList.remove('current-time-highlight');
            });

            // Skip weekends for regular studies
            if (plan.category === 'st' && (currentDay === 0 || currentDay === 6)) {
                onTimeSlotChange?.("Weekend! Czas wolny od zajęć 🎉", null);
                return;
            }

            // Find current time slot
            const rows = table.querySelectorAll('tr');
            let currentSlot = null;

            rows.forEach((row, i) => {
                if (i === 0) return; // Skip header row

                const timeCell = row.querySelector('td:first-child');
                if (!timeCell) return;

                const timeParts = timeCell.textContent?.split('-') || [];
                if (timeParts.length !== 2) return;

                const startTime = convertTimeToMinutes(timeParts[0]);
                const endTime = convertTimeToMinutes(timeParts[1]);

                if (currentTime >= startTime && currentTime < endTime) {
                    const dayCell = row.cells[currentDay];
                    if (dayCell) {
                        dayCell.classList.add('current-time-highlight');
                        currentSlot = dayCell.textContent || null;
                    }
                }
            });

            onTimeSlotChange?.(currentSlot, null);
        };

        highlightCurrentTimeSlot();
        const interval = setInterval(highlightCurrentTimeSlot, 60000);

        return () => clearInterval(interval);
    }, [plan, currentWeek, onTimeSlotChange]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-wspia-gray">Plan zajęć</h2>
                <span className="text-sm text-gray-500">
                    Ostatnia aktualizacja: {timeSinceUpdate(plan.timestamp)}
                </span>
            </div>

            <div
                ref={containerRef}
                className="overflow-x-auto relative"
                id="plan-content"
                dangerouslySetInnerHTML={{ __html: filteredHtml }}
            />
        </div>
    );
};
