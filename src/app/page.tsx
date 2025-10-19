'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
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
import { getPlan, getMixedPlanGroups, getPlanMetadata } from '@/lib/api';
import { mergeHTMLTables } from '@/lib/htmlMerger';

// Stałe dla localStorage
const MERGE_TOGGLE_KEY = 'planMergeEnabled';
const FILTER_TOGGLE_KEY = 'planFilterEnabled';

export default function HomePage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [selection, setSelection] = useState<Partial<SelectionState>>({});
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isPlanMixed, setIsPlanMixed] = useState<boolean>(false);
  const [planMetadata, setPlanMetadata] = useState<any>(null);
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
      // Only proceed if we have a plan selected
      if (!selection.plan) {
        setPlan(null);
        return;
      }

      // Use the isPlanMixed state which is set from SelectionControls
      console.log('Loading plan - isPlanMixed:', isPlanMixed, 'selection:', selection);

      // For mixed plans - require BOTH groups to be selected
      if (isPlanMixed) {
        // Check that we have at least 2 groups and they are not empty strings
        const validGroups = selection.selectedGroups?.filter(g => g && g.trim() !== '') || [];
        if (validGroups.length >= 2) {
          console.log('Loading mixed plan with valid groups:', validGroups); // Debug log
          setPlanLoading(true);
          try {
            // Fetch HTML for each selected group
            const response = await getMixedPlanGroups(
              selection.plan,
              validGroups // Use validated groups
            );
            console.log('Received HTML for groups:', Object.keys(response.htmls)); // Debug log

            // Merge the HTML tables client-side
            const mergedHtml = mergeHTMLTables(response.htmls);
            console.log('Merged HTML created'); // Debug log

            setPlan({
              id: `${selection.plan}-mixed`,
              html: mergedHtml,
              htmlPerGroup: response.htmls,
              timestamp: response.timestamp,
              category: response.category || selection.category || null,
              mixed: true
            });
            setError(null);
          } catch (err) {
            setError('Nie udało się załadować planu. Spróbuj ponownie później.');
            console.error('Failed to load mixed plan:', err);
          } finally {
            setPlanLoading(false);
          }
        } else {
          // Mixed plan but specialization not selected yet - clear plan and show message
          console.log('Mixed plan but specialization not selected. Valid groups:', validGroups);
          setPlan(null);
          setError(null); // Clear any previous errors
          setPlanLoading(false);
        }
      }
      // For regular (non-mixed) plans with single group
      else if (!isPlanMixed && selection.group) {
        console.log('Loading regular plan for group:', selection.group);
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
      } else if (!selection.group) {
        // No group selected yet
        setPlan(null);
      }
    };

    loadPlan();
  }, [selection.plan, selection.group, selection.selectedGroups, isPlanMixed]);

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  if (isMaintenanceMode) {
    return <MaintenancePage />;
  }

  const handleSelectionChange = (newSelection: Partial<SelectionState> & { planMixed?: boolean }) => {
    console.log('Selection changed:', newSelection); // Debug log
    setSelection(newSelection);

    // Save mixed state if provided
    if (typeof newSelection.planMixed !== 'undefined') {
      setIsPlanMixed(newSelection.planMixed);
      console.log('Plan mixed state updated:', newSelection.planMixed);
    }

    localStorage.setItem('schedule-selection', JSON.stringify(newSelection));
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    if (direction === 'next') {
      // Usuń limit - pozwól przewijać do przodu bez ograniczeń
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

  // Generate dynamic page title
  const pageTitle = selection.group
    ? `Plan zajęć ${selection.group}${selection.specialization ? ` - ${selection.specialization}` : ''} | WSPA Lublin`
    : 'Plan Zajęć WSPA Lublin - Nieoficjalny Rozkład Zajęć';

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Plan Zajęć WSPA Lublin",
    "description": "Nieoficjalny plan zajęć Wyższej Szkoły Prawa i Administracji w Lublinie",
    "url": "https://planinf.pl",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Any",
    "provider": {
      "@type": "EducationalOrganization",
      "name": "Wyższa Szkoła Prawa i Administracji w Lublinie",
      "alternateName": "WSPA Lublin",
      "url": "https://wspa.lublin.pl",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Lublin",
        "addressCountry": "PL"
      }
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "PLN"
    }
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={
          selection.group
            ? `Plan zajęć grupy ${selection.group} na WSPA w Lublinie. Sprawdź aktualny rozkład zajęć, sale i prowadzących.`
            : 'Nieoficjalny plan zajęć WSPA Lublin. Sprawdź rozkład zajęć dla wszystkich kierunków i grup.'
        } />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`https://planinf.pl${selection.group ? `?group=${encodeURIComponent(selection.group)}` : ''}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
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
            {selection.group
              ? `Plan zajęć - ${selection.group}${selection.specialization ? ` - ${selection.specialization}` : ''}`
              : 'Plan zajęć'}
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
                
                {plan && (
                  <WeekControls
                    onPrevWeek={() => handleWeekChange('prev')}
                    onNextWeek={() => handleWeekChange('next')}
                    currentWeek={currentWeek}
                    isPrevDisabled={weekOffset === 0}
                    isNextDisabled={false}  // Usuń limit - zawsze pozwól iść do przodu
                    planHtml={plan.html}
                    mergeEnabled={mergeEnabled}
                    isFilteringEnabled={filterEnabled}
                    onFilterToggle={handleFilterToggle}
                    onMergeToggle={handleMergeToggle}
                    // Calendar subscription props
                    planId={selection.plan}
                    groupName={selection.group}
                    selectedGroups={selection.selectedGroups}
                    isMixedPlan={isPlanMixed}
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

        {/* Blog Section - Clean Card */}
        <div className="mt-8">
          <BlogSection />
        </div>

        {/* Minimalist Footer */}
        <footer className="mt-16 py-12 border-t border-gray-100">
          <div className="text-center space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                Plan Zajęć WSPA Lublin
              </p>
              <p className="text-xs text-gray-500">
                Nieoficjalne narzędzie • Działa za pozwoleniem uczelni
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <span>Informatyka</span>
              <span className="text-gray-300">•</span>
              <span>Prawo</span>
              <span className="text-gray-300">•</span>
              <span>Administracja</span>
              <span className="text-gray-300">•</span>
              <span>Bezpieczeństwo</span>
            </div>
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} • Stworzone dla społeczności WSPA
            </p>
          </div>
        </footer>
      </div>
    </main>
    </>
  );
}
