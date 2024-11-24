import { useEffect, useRef } from 'react';
import { Plan } from '@/types/schedule';
import { timeSinceUpdate } from '@/lib/utils';
import { convertTimeToMinutes } from '@/lib/utils';
interface PlanDisplayProps {
  plan: string; // HTML planu
  currentWeek: WeekRange;
  onTimeSlotChange?: (current: string | null, next: string | null) => void;
}

export const PlanDisplay: React.FC<PlanDisplayProps> = ({
    plan,
    currentWeek,
    onTimeSlotChange
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

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
                className="overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: plan.html }}
            />
        </div>
    );
};