'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFaculties, getPlans } from '@/lib/api';
import { SelectionState, PlanGroup } from '@/types/schedule';

interface SelectionControlsProps {
  onSelectionChange: (selection: Partial<SelectionState>) => void;
  initialSelection?: Partial<SelectionState>;
}

interface PlanGroup {
  id: string;
  name: string;
  groups: string[];
  timestamp: string;
}

const LAST_SELECTION_KEY = 'lastPlanSelection';

// Add a LoadingIndicator component
const LoadingIndicator = () => (
  <div className="flex items-center justify-center py-2">
    <div className="w-5 h-5 border-2 border-wspia-red border-t-transparent rounded-full animate-spin mr-2"></div>
    <span className="text-wspia-gray text-sm">Ładowanie...</span>
  </div>
);

export const SelectionControls: React.FC<SelectionControlsProps> = ({
  onSelectionChange,
  initialSelection = {}
}) => {
    const [faculties, setFaculties] = useState<string[]>([]);
    const [plans, setPlans] = useState<Record<string, PlanGroup>>({});
    const [selection, setSelection] = useState<Partial<SelectionState>>(() => {
      if (typeof window !== 'undefined') {
        const savedSelection = localStorage.getItem(LAST_SELECTION_KEY);
        return savedSelection ? JSON.parse(savedSelection) : initialSelection;
      }
      return initialSelection;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasRestoredState, setHasRestoredState] = useState(false);

  const categories = [
    { value: "st", label: "Studia Stacjonarne" },
    { value: "nst", label: "Studia Niestacjonarne" },
    { value: "nst_puw", label: "Studia Niestacjonarne PUW" }
  ];

  // Restore saved selection on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSelection = localStorage.getItem(LAST_SELECTION_KEY);
      if (savedSelection) {
        const parsed = JSON.parse(savedSelection);
        console.log('Restoring saved selection on mount:', parsed);

        // If this is a complete selection with mixed plan, notify parent
        if (parsed.plan && parsed.planMixed && parsed.selectedGroups?.length > 0) {
          console.log('Notifying parent about restored mixed plan selection');
          onSelectionChange(parsed);
        } else if (parsed.plan && parsed.group) {
          console.log('Notifying parent about restored regular plan selection');
          onSelectionChange(parsed);
        }
      }
    }
  }, []); // Run only once on mount

  useEffect(() => {
    const loadFaculties = async () => {
      if (selection.category) {
        setLoading(true);
        try {
          const data = await getFaculties(selection.category);
          setFaculties(data);
          setError(null);
        } catch (err) {
          console.error('Error loading faculties:', err);
          setError('Nie udało się załadować kierunków');
          setFaculties([]);
        } finally {
          setLoading(false);
        }
      }
    };
    loadFaculties();
  }, [selection.category]);
  const renderGroups = (filterType?: 'base' | 'specialization') => {
    if (!selection.plan || !plans[selection.plan]) {
      return <option value="">Najpierw wybierz plan</option>;
    }

    const selectedPlan = plans[selection.plan];
    const groups = Array.isArray(selectedPlan.groups)
      ? selectedPlan.groups
      : Object.keys(selectedPlan.groups || {});

    // Filter groups based on type if specified
    let filteredGroups = groups;
    if (filterType === 'base') {
      // Base groups are those that start with "GRUPA X" pattern (where X is a number)
      // and don't have "Sp." prefix
      filteredGroups = groups.filter(g => {
        const normalized = g.toLowerCase();
        const hasSpPrefix = g.includes('Sp.');
        const isBaseGroup = normalized.match(/^grupa \d+/) !== null;
        return isBaseGroup && !hasSpPrefix;
      });
    } else if (filterType === 'specialization') {
      // Show specializations (those with "Sp." prefix)
      // Exclude base groups (those that match "GRUPA X" pattern at the start)
      filteredGroups = groups.filter(g => {
        const normalized = g.toLowerCase();
        const hasSpPrefix = g.includes('Sp.');
        const isBaseGroup = normalized.match(/^grupa \d+/) !== null;
        return hasSpPrefix || !isBaseGroup;
      });
    }

    return (
      <>
        {filterType !== 'specialization' && <option value="">Wybierz grupę</option>}
        {filteredGroups.map(groupName => (
          <option key={groupName} value={groupName}>
            {groupName}
          </option>
        ))}
      </>
    );
  };
  useEffect(() => {
    const loadPlans = async () => {
      if (selection.category && selection.faculty) {
        setLoading(true);
        try {
          const data = await getPlans(selection.category, selection.faculty);
          setPlans(data);
          setError(null);

          // After plans are loaded, restore the mixed state if needed
          if (!hasRestoredState && selection.plan && data[selection.plan]) {
            const planData = data[selection.plan];

            // Check if this is a mixed plan
            if (planData.mixed) {
              console.log('Restoring mixed plan state for:', selection.plan);

              // Restore the full selection with mixed state
              const restoredSelection = {
                ...selection,
                planMixed: true,
                // Ensure selectedGroups is properly restored
                selectedGroups: selection.selectedGroups ||
                  (selection.group && selection.specialization
                    ? [selection.group, selection.specialization]
                    : [])
              };

              // Notify parent component about the restored mixed state
              onSelectionChange(restoredSelection);
              setSelection(restoredSelection);
              setHasRestoredState(true);
            } else if (selection.planMixed && !planData.mixed) {
              // Clear mixed state if plan is not actually mixed
              const cleanedSelection = {
                ...selection,
                planMixed: false,
                selectedGroups: []
              };
              onSelectionChange(cleanedSelection);
              setSelection(cleanedSelection);
              setHasRestoredState(true);
            }
          }
        } catch (err) {
          console.error('Error loading plans:', err);
          setError('Nie udało się załadować planów');
          setPlans({});
        } finally {
          setLoading(false);
        }
      }
    };
    loadPlans();
  }, [selection.category, selection.faculty, hasRestoredState]);

  const handleSelectionChange = (field: keyof SelectionState, value: string) => {
    const newSelection = { ...selection, [field]: value };

    // Reset dependent fields
    if (field === 'category') {
      delete newSelection.faculty;
      delete newSelection.plan;
      delete newSelection.group;
      delete newSelection.specialization;
      delete newSelection.selectedGroups;
      delete newSelection.planMixed;
    } else if (field === 'faculty') {
      delete newSelection.plan;
      delete newSelection.group;
      delete newSelection.specialization;
      delete newSelection.selectedGroups;
      delete newSelection.planMixed;
    } else if (field === 'plan') {
      delete newSelection.group;
      delete newSelection.specialization;
      delete newSelection.selectedGroups;

      // Check if the selected plan is mixed and set the flag immediately
      if (value && plans[value]) {
        newSelection.planMixed = plans[value].mixed || false;
        console.log(`Plan ${value} selected, mixed: ${newSelection.planMixed}`);
      } else {
        delete newSelection.planMixed;
      }
    }

    setSelection(newSelection);
    onSelectionChange(newSelection);

    // Save selection to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAST_SELECTION_KEY, JSON.stringify(newSelection));
    }
  };

  const getAvailableGroups = () => {
    if (!selection.plan || !plans[selection.plan]) {
      return [];
    }
    
    const planData = plans[selection.plan];
    console.log('Plan data:', planData); // Debug

    if (!planData.groups) {
      console.log('No groups found in plan data'); // Debug
      return [];
    }

    if (Array.isArray(planData.groups)) {
      return planData.groups;
    }

    // Jeśli groups jest obiektem, konwertuj klucze na tablicę
    return Object.keys(planData.groups);
  };

  return (
    <div className="space-y-4 transition-all duration-300 ease-in-out w-full">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading && <LoadingIndicator />}

      <div className={`select-wrapper ${selection.category ? 'active' : ''}`}>
        <label className="block text-wspia-gray font-medium mb-2">
          Wybierz tryb studiów:
        </label>
        <select
          className="w-full p-3 border rounded-lg shadow-sm focus:border-wspia-red focus:ring-1 focus:ring-wspia-red"
          value={selection.category || ''}
          onChange={(e) => handleSelectionChange('category', e.target.value)}
          disabled={loading}
        >
          <option value="">Wybierz tryb studiów</option>
          {categories.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {selection.category && (
        <div className={`select-wrapper animate-slideDown ${selection.faculty ? 'active' : ''}`}>
          <label className="block text-wspia-gray font-medium mb-2">
            Wybierz kierunek:
          </label>
          <select
            className="w-full p-3 border rounded-lg shadow-sm focus:border-wspia-red focus:ring-1 focus:ring-wspia-red"
            value={selection.faculty || ''}
            onChange={(e) => handleSelectionChange('faculty', e.target.value)}
            disabled={loading}
          >
            <option value="">Wybierz kierunek</option>
            {faculties.sort().map((faculty) => (
              <option key={faculty} value={faculty}>{faculty}</option>
            ))}
          </select>
        </div>
      )}

      {selection.faculty && (
        <div className={`select-wrapper animate-slideDown ${selection.plan ? 'active' : ''}`}>
          <label className="block text-wspia-gray font-medium mb-2">
            Wybierz plan:
          </label>
          <select
            className="w-full p-3 border rounded-lg shadow-sm focus:border-wspia-red focus:ring-1 focus:ring-wspia-red"
            value={selection.plan || ''}
            onChange={(e) => handleSelectionChange('plan', e.target.value)}
          >
            <option value="">Wybierz plan</option>
            {Object.values(plans).sort((a, b) => a.name.localeCompare(b.name)).map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selection.plan && (
        <>
          <div className="select-wrapper animate-slideDown">
            <label className="block text-wspia-gray font-medium mb-2">
              Wybierz grupę:
            </label>
            <select
              className="w-full p-3 border rounded-lg shadow-sm focus:border-wspia-red focus:ring-1 focus:ring-wspia-red"
              value={selection.group || ''}
              onChange={(e) => {
                const isMixed = plans[selection.plan]?.mixed || false;
                if (isMixed) {
                  // For mixed plans, don't set selectedGroups yet - wait for specialization
                  const newSelection = {
                    ...selection,
                    group: e.target.value,
                    specialization: '',
                    selectedGroups: [], // Clear selectedGroups until specialization is chosen
                    planMixed: true // Keep mixed state
                  };
                  setSelection(newSelection);
                  onSelectionChange(newSelection);
                } else {
                  // For normal plans, just update the group
                  const newSelection = {
                    ...selection,
                    group: e.target.value,
                    // Don't override planMixed if it's already set
                    planMixed: selection.planMixed !== undefined ? selection.planMixed : false
                  };
                  setSelection(newSelection);
                  onSelectionChange(newSelection);
                }
              }}
            >
              {plans[selection.plan]?.mixed ? renderGroups('base') : renderGroups()}
            </select>
          </div>

          {/* Show specialization dropdown for mixed plans */}
          {plans[selection.plan]?.mixed && selection.group && (
            <div className="select-wrapper animate-slideDown mt-4">
              <label className="block text-wspia-gray font-medium mb-2">
                Wybierz specjalizację:
              </label>
              <select
                className="w-full p-3 border rounded-lg shadow-sm focus:border-wspia-red focus:ring-1 focus:ring-wspia-red"
                value={selection.specialization || ''}
                onChange={(e) => {
                  const newSelection = {
                    ...selection,
                    specialization: e.target.value,
                    // For mixed plans, only set selectedGroups when specialization is actually selected
                    selectedGroups: e.target.value && e.target.value.trim() !== ''
                      ? [selection.group, e.target.value]
                      : [], // Empty array if no specialization selected
                    planMixed: true // Keep mixed state
                  };
                  setSelection(newSelection);
                  onSelectionChange(newSelection);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem(LAST_SELECTION_KEY, JSON.stringify(newSelection));
                  }
                }}
              >
                <option value="">Wybierz specjalizację</option>
                {renderGroups('specialization')}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
};
