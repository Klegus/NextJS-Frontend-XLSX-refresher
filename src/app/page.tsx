'use client';

import { useState, useEffect } from 'react';
import { MaintenancePage } from '@/components/status/MaintenancePage';
import { checkServerStatus, isMaintenanceMode as checkMaintenance } from '@/api/serverStatus';
import { SelectionControls } from '@/components/schedule/SelectionControls';
import { PlanDisplay } from '@/components/schedule/PlanDisplay';
import { BlogSection } from '@/components/activities/BlogSection';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { WeekControls } from '@/components/schedule/WeekControls';
import { CurrentLessonInfo } from '@/components/schedule/CurrentLessonInfo';
import { getWeekRange, shouldShowNextWeek } from '@/lib/utils';
import { Plan, SelectionState } from '@/types/schedule';
import { getPlan } from '@/lib/api';

// Stałe dla localStorage
const MERGE_TOGGLE_KEY = 'planMergeEnabled';
const FILTER_TOGGLE_KEY = 'planFilterEnabled';

export default function HomePage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [selection, setSelection] = useState<Partial<SelectionState>>({});
  const [plan, setPlan] = useState<Plan | null>(null);
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    return getWeekRange(shouldShowNextWeek() ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : now);
  });
  const [error, setError] = useState<string | null>(null);
  const [currentTimeSlot, setCurrentTimeSlot] = useState<string | null>(null);
  const [nextTimeSlot, setNextTimeSlot] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  // Dodajemy stan dla opcji filtrowania i łączenia komórek
  const [filterEnabled, setFilterEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(FILTER_TOGGLE_KEY) === 'true';
    }
    return true; // Domyślnie włączone
  });
  
  const [mergeEnabled, setMergeEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(MERGE_TOGGLE_KEY) === 'true';
    }
    return true; // Domyślnie włączone
  });
  
  // Funkcje obsługujące zmiany stanów
  const handleFilterToggle = (value: boolean) => {
    setFilterEnabled(value);
  };
  
  const handleMergeToggle = (value: boolean) => {
    setMergeEnabled(value);
  };

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const status = await checkServerStatus();
        setIsMaintenanceMode(checkMaintenance(status));
        
        // Ustaw interwał sprawdzania na podstawie otrzymanej wartości
        const interval = setInterval(async () => {
          const newStatus = await checkServerStatus();
          setIsMaintenanceMode(checkMaintenance(newStatus));
        }, status.check_interval * 1000); // konwersja na milisekundy

        return () => clearInterval(interval);
      } catch (error) {
        console.error('Błąd podczas sprawdzania statusu serwera:', error);
        setError('Nie udało się sprawdzić statusu serwera');
      } finally {
        setInitialLoading(false);
      }
    };

    checkMaintenanceStatus();
  }, []);

  useEffect(() => {
    // Load saved selection from localStorage
    const saved = localStorage.getItem('schedule-selection');
    if (saved) {
      try {
        const parsedSelection = JSON.parse(saved);
        setSelection(parsedSelection);
      } catch (error) {
        console.error('Failed to parse saved selection:', error);
      }
    }
  }, []);

  useEffect(() => {
    const loadPlan = async () => {
      if (selection.plan && selection.group) {
        setPlanLoading(true);
        try {
          const newPlan = await getPlan(selection.plan, selection.group);
          setPlan(newPlan);
          setError(null);
        } catch (err) {
          setError('Nie udało się załadować planu. Spróbuj ponownie później.');
          console.error('Failed to load plan:', err);
        } finally {
          setPlanLoading(false);
        }
      } else {
        setPlan(null);
      }
    };

    loadPlan();
  }, [selection.plan, selection.group]);

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  if (isMaintenanceMode) {
    return <MaintenancePage />;
  }

  const handleSelectionChange = (newSelection: Partial<SelectionState>) => {
    setSelection(newSelection);
    localStorage.setItem('schedule-selection', JSON.stringify(newSelection));
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    if (direction === 'next' && weekOffset < 1) {
      setWeekOffset(prev => prev + 1);
      setCurrentWeek(prev => {
        const newDate = new Date(prev.start);
        newDate.setDate(newDate.getDate() + 7);
        return getWeekRange(newDate);
      });
    } else if (direction === 'prev' && weekOffset > 0) {
      setWeekOffset(prev => prev - 1);
      setCurrentWeek(prev => {
        const newDate = new Date(prev.start);
        newDate.setDate(newDate.getDate() - 7);
        return getWeekRange(newDate);
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Initial loading overlay */}
      {initialLoading && <LoadingSpinner />}
      
      <div className="max-w-[1400px] mx-auto py-12 relative">
        {/* Logo and Header */}
        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-6 bg-white rounded-full shadow-lg overflow-hidden flex items-center justify-center">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAvu7fXk3m4Lz5iwLKJHAPKlelKnT8CjI-Bg&s"
              alt="WSPiA Logo"
              className="w-24 h-24 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {selection.group ? `Plan zajęć - ${selection.group}` : 'Plan zajęć'}
          </h1>
        </div>

        {/* Main Content Grid */}
        <div className={`${
          plan 
            ? "grid grid-cols-1 lg:grid-cols-[300px_1fr]" 
            : "flex justify-center"
        } gap-8 max-w-full relative`}>
          {/* Selection Controls */}
          <div className="transition-all duration-500 px-4 lg:px-0">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full sticky top-4">
              <SelectionControls
                onSelectionChange={handleSelectionChange}
                initialSelection={selection}
              />
            </div>
          </div>

          {/* Schedule Display */}
          <div className={`${plan ? 'block px-4 lg:px-8' : 'hidden'} transition-all duration-500 relative`}>
            {planLoading && (
              <div className="absolute inset-0 flex justify-center items-center bg-white/50 z-10 rounded-lg backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border-3 border-wspia-red border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-2 text-wspia-gray text-sm font-medium">Ładowanie planu...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            {plan && (
              <>
                <CurrentLessonInfo
                  currentTimeSlot={currentTimeSlot}
                  nextTimeSlot={nextTimeSlot}
                />
                
                {plan.category === 'st' && (
                  <WeekControls
                    onPrevWeek={() => handleWeekChange('prev')}
                    onNextWeek={() => handleWeekChange('next')}
                    currentWeek={currentWeek}
                    isPrevDisabled={weekOffset === 0}
                    isNextDisabled={weekOffset === 1}
                    planHtml={plan.html}
                    mergeEnabled={mergeEnabled}
                    isFilteringEnabled={filterEnabled}
                    onFilterToggle={handleFilterToggle}
                    onMergeToggle={handleMergeToggle}
                  />
                )}
                
                <PlanDisplay
                  plan={plan}
                  currentWeek={currentWeek}
                  onTimeSlotChange={(current, next) => {
                    setCurrentTimeSlot(current);
                    setNextTimeSlot(next);
                  }}
                  onFilterToggle={handleFilterToggle}
                  onMergeToggle={handleMergeToggle}
                />
              </>
            )}
          </div>
        </div>

        {/* Blog Section */}
        <div className="mt-12">
          <BlogSection />
        </div>
      </div>
    </main>
  );
}
