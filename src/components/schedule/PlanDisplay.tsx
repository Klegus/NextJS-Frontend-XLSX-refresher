import { useEffect, useRef, useState, useCallback } from 'react';
import { Toggle } from '@/components/ui/Toggle';
import { Plan } from '@/types/schedule';
import { timeSinceUpdate, convertTimeToMinutes } from '@/lib/utils';
import { censorLecturerNamesInHtml, isCensorshipEnabled } from '../../../utils/censor';
import { EmailVerificationModal } from '@/components/ui/EmailVerificationModal';
import { SuggestionModal } from '@/components/ui/SuggestionModal';

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
    
    // Check if censorship is enabled globally via environment variable
    const isCensorshipEnabledGlobally = typeof process !== 'undefined' && 
                                       process.env.NEXT_PUBLIC_ENABLE_CENSORSHIP === 'true';
    
    // Dodajemy stan dla kontroli cenzury i modala, tylko jeśli cenzura jest włączona globalnie
    const [censorshipDisabled, setCensorshipDisabled] = useState(() => {
        if (!isCensorshipEnabledGlobally) {
            return true; // Cenzura jest zawsze wyłączona, jeśli jest wyłączona globalnie
        }
        
        if (typeof window !== 'undefined') {
            // Sprawdzamy czy cenzura jest wyłączona (użytkownik jest zweryfikowany)
            return localStorage.getItem('verified_email') === 'true';
        }
        return false;
    });
    const [showModal, setShowModal] = useState(false);

    // Dodajemy stan dla modalu sugestii
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);

    const filterPlanForCurrentWeek = (html: string, weekRange: { start: Date; end: Date }) => {
        // Apply name censorship only if it's enabled globally
        if (isCensorshipEnabledGlobally) {
            html = censorLecturerNamesInHtml(html);
        }
        
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
                if (index > 5) { // Wyczyść zawartość kolumn po piątku
                    cell.innerHTML = '';
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

            // Nie ukrywamy już całych wierszy, nawet jeśli nie ma lekcji w tym tygodniu
        }

        return table.outerHTML;
    };

    const processHtml = (htmlContent: string) => {
        // Apply name censorship only if it's enabled globally
        if (isCensorshipEnabledGlobally) {
            htmlContent = censorLecturerNamesInHtml(htmlContent);
        }
        
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

    // Funkcja obsługująca zmianę stanu cenzury
    const handleCensorshipToggle = () => {
        if (censorshipDisabled) {
            // Jeśli cenzura jest wyłączona, włączamy ją ponownie
            localStorage.removeItem('verified_email');
            localStorage.removeItem('verified_email_address');
            setCensorshipDisabled(false);
            // Odświeżamy zawartość planu
            updatePlanContent();
        } else {
            // Sprawdź, czy użytkownik jest już zweryfikowany
            const verifiedEmail = localStorage.getItem('verified_email_address');
            if (verifiedEmail) {
                // Jeśli email jest już zweryfikowany, po prostu wyłączamy cenzurę
                localStorage.setItem('verified_email', 'true');
                setCensorshipDisabled(true);
                // Odświeżamy zawartość planu
                updatePlanContent();
            } else {
                // Jeśli nie jest zweryfikowany, wyświetlamy modal weryfikacji
                setShowModal(true);
            }
        }
    };

    // Obsługa weryfikacji emaila
    const handleEmailVerification = (verified: boolean) => {
        if (verified) {
            // Zakładamy, że localStorage został już ustawiony w komponencie modala
            setCensorshipDisabled(true);
            // Odświeżamy zawartość planu
            updatePlanContent();
        }
    };

    // Funkcja do odświeżania zawartości planu
    const updatePlanContent = useCallback(() => {
        let processedHtml = processHtml(plan.html);
        
        if (plan.category === 'st' && currentWeek && filterEnabled) {
            processedHtml = filterPlanForCurrentWeek(processedHtml, currentWeek);
        }
        
        setFilteredHtml(processedHtml);
    }, [plan.html, plan.category, currentWeek, filterEnabled, processHtml, filterPlanForCurrentWeek]);

    // Efekt dla aktualizacji planu gdy zmienia się status cenzury lub inne stany
    useEffect(() => {
        updatePlanContent();
    }, [censorshipDisabled, filterEnabled, mergeEnabled, plan, currentWeek, updatePlanContent]);

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
    
            // Skip weekends regardless of category
            if (currentDay === 0 || currentDay === 6) {
                onTimeSlotChange?.("Weekend! Czas wolny od zajęć 🎉", null);
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
                    const dayCell = rows[i].cells[currentDay];
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
                    <div className="flex flex-wrap items-center gap-4">
                        {plan.category === 'st' && (
                            <div className="flex items-center gap-2">
                                <Toggle
                                    checked={filterEnabled}
                                    onChange={handleFilterToggle}
                                    label="Filtruj bieżący tydzień"
                                />
                                <span className="text-sm text-gray-600">
                                    Filtruj bieżący tydzień
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Toggle
                                checked={mergeEnabled}
                                onChange={handleMergeToggle}
                                label="Łącz komórki"
                            />
                            <span className="text-sm text-gray-600">
                                Łącz komórki
                            </span>
                        </div>
                        {/* Render the censorship toggle only if censorship is enabled globally */}
                        {isCensorshipEnabledGlobally && (
                            <div className="flex items-center gap-2">
                                <Toggle
                                    checked={censorshipDisabled}
                                    onChange={handleCensorshipToggle}
                                    label="Pokaż pełne dane wykładowców"
                                />
                                <span className="text-sm text-gray-600">
                                    Pokaż pełne dane wykładowców
                                </span>
                            </div>
                        )}
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
            
            {/* Dodajemy przycisk do zgłaszania sugestii */}
            <div className="mt-4 flex justify-end">
                <button 
                    onClick={() => setShowSuggestionModal(true)}
                    className="px-4 py-2 text-wspia-red border-2 border-wspia-red rounded-lg hover:bg-wspia-red  transition-colors text-sm"
                >
                    Zgłoś sugestię lub błąd
                </button>
            </div>
            
            {/* Modal weryfikacji emaila - show only if censorship is enabled globally */}
            {isCensorshipEnabledGlobally && (
                <EmailVerificationModal 
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onVerify={handleEmailVerification}
                />
            )}
            
            {/* Modal zgłaszania sugestii */}
            <SuggestionModal
                isOpen={showSuggestionModal}
                onClose={() => setShowSuggestionModal(false)}
            />
        </div>
    );
};
