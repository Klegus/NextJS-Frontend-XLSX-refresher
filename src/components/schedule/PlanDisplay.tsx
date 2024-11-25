import { useEffect, useRef, useState, useCallback } from 'react';
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
const MERGE_TOGGLE_KEY = 'planMergeEnabled';

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

    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [mergeEnabled, setMergeEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(MERGE_TOGGLE_KEY);
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
                        /^([^-]+?)(?=-)(-)/,
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

    useEffect(() => {
        let processedHtml = processHtml(plan.html);
        
        if (plan.category === 'st' && currentWeek && filterEnabled) {
            processedHtml = filterPlanForCurrentWeek(processedHtml, currentWeek);
        }
        
        setFilteredHtml(processedHtml);
    }, [plan, currentWeek, filterEnabled, mergeEnabled]);

    const handleFilterToggle = () => {
        const newValue = !filterEnabled;
        setFilterEnabled(newValue);
        localStorage.setItem(FILTER_TOGGLE_KEY, String(newValue));
    };

    const handleMergeToggle = () => {
        const newValue = !mergeEnabled;
        setMergeEnabled(newValue);
        localStorage.setItem(MERGE_TOGGLE_KEY, String(newValue));
    };

    const handleNotificationToggle = useCallback(async () => {
        if (!notificationsEnabled) {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const registration = await navigator.serviceWorker.register('/notification-worker.js');
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                    });
                    
                    await fetch('/api/notifications/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            subscription,
                            planId: plan.id
                        })
                    });
                    
                    setNotificationsEnabled(true);
                    localStorage.setItem(`notifications-${plan.id}`, 'true');
                }
            } catch (error) {
                console.error('Failed to enable notifications:', error);
            }
        } else {
            // Wyłącz powiadomienia
            setNotificationsEnabled(false);
            localStorage.removeItem(`notifications-${plan.id}`);
            // TODO: Dodaj endpoint do wypisywania z subskrypcji
        }
    }, [notificationsEnabled, plan.id]);

    // Sprawdź stan powiadomień przy montowaniu
    useEffect(() => {
        const notificationState = localStorage.getItem(`notifications-${plan.id}`);
        setNotificationsEnabled(notificationState === 'true');
    }, [plan.id]);

    const currentHighlightRef = useRef<HTMLTableCellElement | null>(null);

    useEffect(() => {
        const highlightCurrentTimeSlot = () => {
            if (!containerRef.current) return;
    
            const now = new Date();
            const currentDay = now.getDay();
            const currentTime = now.getHours() * 60 + now.getMinutes();
    
            const table = containerRef.current.querySelector('table');
            if (!table) return;
    
            // Skip weekends regardless of category
            if (currentDay === 0 || currentDay === 6) {
                onTimeSlotChange?.("Weekend! Czas wolny od zajęć 🎉", null);
                return;
            }
    
            // Remove highlight from previous cell only if we're going to add a new one
            let foundNewCell = false;
            let newCell: HTMLTableCellElement | null = null;
            let currentSlot: string | null = null;
    
            // Find current time slot
            const rows = table.querySelectorAll('tr');
            
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
                    const dayCell = rows[i].cells[currentDay];
                    if (dayCell) {
                        foundNewCell = true;
                        newCell = dayCell;
                        currentSlot = dayCell.textContent || null;
                        break;
                    }
                }
            }
    
            // Only update highlighting if we found a new cell
            if (foundNewCell && newCell) {
                if (currentHighlightRef.current && currentHighlightRef.current !== newCell) {
                    currentHighlightRef.current.classList.remove('current-time-highlight');
                }
                
                newCell.classList.add('current-time-highlight');
                currentHighlightRef.current = newCell;
                
                newCell.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center'
                });
            }
    
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
    }, [plan, currentWeek]);

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
                    <div className="flex items-center gap-4">
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
                        <div className="flex items-center gap-2">
                            <Toggle
                                checked={mergeEnabled}
                                onChange={handleMergeToggle}
                                label="Scal komórki"
                            />
                            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                                Scal komórki
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Toggle
                                checked={notificationsEnabled}
                                onChange={handleNotificationToggle}
                                label="Powiadomienia o zmianach"
                            />
                            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                                Powiadomienia
                            </span>
                        </div>
                    </div>
                    
                </div>
                <span className="text-sm text-gray-500 whitespace-nowrap">
                    Ostatnia aktualizacja: {timeSinceUpdate(plan.timestamp)}
                </span>
            </div>

            <div className="overflow-x-auto">
                <div
                    ref={containerRef}
                    className="relative min-w-[800px] lg:min-w-0"
                    id="plan-content"
                    dangerouslySetInnerHTML={{ __html: filteredHtml }}
                />
            </div>
        </div>
    );
};
