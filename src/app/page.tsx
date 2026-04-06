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
import { PlanChanges } from '@/components/schedule/PlanChanges';

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
  const [showChanges, setShowChanges] = useState(false);

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
      <main className="min-h-screen">
      {initialLoading && <LoadingSpinner />}

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative">
        {/* Header */}
        <header className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 mb-6 bg-white rounded-3xl shadow-glass overflow-hidden ring-1 ring-black/[0.04]">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAvu7fXk3m4Lz5iwLKJHAPKlelKnT8CjI-Bg&s"
              alt="WSPiA Logo"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-1.5">
            {selection.faculty
              ? selection.faculty
              : 'Plan zajęć'}
          </h1>
          {selection.group && (
            <p className="text-base sm:text-lg text-ink-muted font-medium mt-1">
              {selection.group}{selection.specialization ? ` · ${selection.specialization}` : ''}
            </p>
          )}
          <p className="text-xs text-ink-muted/50 mt-2 tracking-widest uppercase font-medium">
            WSPA Lublin · {new Date().getMonth() >= 9 ? `${new Date().getFullYear()}/${new Date().getFullYear() + 1}` : `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}
          </p>
        </header>

        <PlanChanges
          isOpen={showChanges}
          onClose={() => setShowChanges(false)}
          planId={selection.plan}
          groupName={selection.group}
        />

        {/* Main Content Grid */}
        <div className={`${
          plan
            ? "grid grid-cols-1 lg:grid-cols-[280px_1fr]"
            : "flex justify-center"
        } gap-6 max-w-full relative`}>
          {/* Selection Controls */}
          <div className="transition-all duration-500">
            <div className="glass-card p-5 w-full sticky top-4">
              <SelectionControls
                onSelectionChange={handleSelectionChange}
                initialSelection={selection}
              />
            </div>
          </div>

          {/* Schedule Display */}
          <div className={`${plan ? 'block' : 'hidden'} transition-all duration-500 relative`}>
            {planLoading && (
              <div className="absolute inset-0 flex justify-center items-center bg-white/60 z-10 rounded-2xl backdrop-blur-md">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-2 border-wspia-red border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-3 text-ink-muted text-sm">Ładowanie planu...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {plan && (
              <div className="space-y-4">
                <CurrentLessonInfo
                  currentTimeSlot={currentTimeSlot}
                  nextTimeSlot={nextTimeSlot}
                />

                <WeekControls
                  onPrevWeek={() => handleWeekChange('prev')}
                  onNextWeek={() => handleWeekChange('next')}
                  currentWeek={currentWeek}
                  isPrevDisabled={weekOffset === 0}
                  isNextDisabled={false}
                  planHtml={plan.html}
                  mergeEnabled={mergeEnabled}
                  isFilteringEnabled={filterEnabled}
                  onFilterToggle={handleFilterToggle}
                  onMergeToggle={handleMergeToggle}
                  planId={selection.plan}
                  groupName={selection.group}
                  selectedGroups={selection.selectedGroups}
                  isMixedPlan={isPlanMixed}
                  onShowChanges={() => setShowChanges(true)}
                />

                <div className="glass-card overflow-hidden">
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
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Blog Section */}
        <div className="mt-12">
          <BlogSection />
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 pb-6 border-t border-gray-200/60">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-ink">
              Plan Zajęć WSPA Lublin
            </p>
            <p className="text-xs text-ink-muted">
              Nieoficjalne narzędzie · Działa za pozwoleniem uczelni
            </p>
            <p className="text-xs text-ink-muted/60">
              © {new Date().getFullYear()} · Stworzone dla społeczności WSPA
            </p>
          </div>
        </footer>
      </div>
    </main>
    </>
  );
}
