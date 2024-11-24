'use client';

import { useState, useEffect } from 'react';
import MaintenancePage from './maintenance';
import { SelectionControls } from '@/components/schedule/SelectionControls';
import { PlanDisplay } from '@/components/schedule/PlanDisplay';
import { BlogSection } from '@/components/activities/BlogSection';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { WeekControls } from '@/components/schedule/WeekControls';
import { CurrentLessonInfo } from '@/components/schedule/CurrentLessonInfo';
import { getWeekRange, shouldShowNextWeek } from '@/lib/utils';
import { Plan, SelectionState } from '@/types/schedule';
import { getPlan } from '@/lib/api';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const response = await fetch('/api/status');
        const data = await response.json();
        setIsMaintenanceMode(data.maintenance_mode === true);
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
      } finally {
        setLoading(false);
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
        setLoading(true);
        try {
          const newPlan = await getPlan(selection.plan, selection.group);
          setPlan(newPlan);
          setError(null);
        } catch (err) {
          setError('Nie udało się załadować planu. Spróbuj ponownie później.');
          console.error('Failed to load plan:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setPlan(null);
      }
    };

    loadPlan();
  }, [selection.plan, selection.group]);

  if (loading) {
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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-4 lg:mx-8 py-12">
        {/* Logo and Header */}
        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-6 bg-white rounded-full shadow-lg overflow-hidden flex items-center justify-center">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAvu7fXk3m4Lz5iwLKJHAPKlelKnT8CjI-Bg&s"
              alt="WSPiA Logo"
              className="w-24 h-24 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {selection.group ? `Plan zajęć - ${selection.group}` : 'Plan zajęć'}
          </h1>
        </div>

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row gap-8 relative overflow-visible">
          {/* Selection Controls */}
          <div className={`${
            plan ? 
            'w-full lg:w-[300px] lg:absolute lg:-left-[320px] selection-controls-enter' : 
            ''
          } transition-all duration-500 lg:px-0 px-4`}>
            <div className="bg-white rounded-lg shadow-lg p-6 w-full">
              <SelectionControls
                onSelectionChange={handleSelectionChange}
                initialSelection={selection}
              />
            </div>
          </div>

          {/* Schedule Display */}
          <div className={`${plan ? 'w-full lg:flex-1 lg:px-8 px-4' : 'hidden'} transition-all duration-500`}>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
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
                      />
                    )}
                    
                    <PlanDisplay
                      plan={plan}
                      currentWeek={currentWeek}
                      onTimeSlotChange={(current, next) => {
                        setCurrentTimeSlot(current);
                        setNextTimeSlot(next);
                      }}
                    />
                  </>
                )}
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
