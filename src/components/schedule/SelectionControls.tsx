'use client';

import { useState, useEffect } from 'react';
import { getFaculties, getPlans } from '@/lib/api';
import { SelectionState } from '@/types/schedule';

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

export const SelectionControls: React.FC<SelectionControlsProps> = ({
  onSelectionChange,
  initialSelection = {}
}) => {
    const [faculties, setFaculties] = useState<string[]>([]);
    const [plans, setPlans] = useState<Record<string, PlanGroup>>({});
    const [selection, setSelection] = useState<Partial<SelectionState>>(initialSelection);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: "st", label: "Studia Stacjonarne" },
    { value: "nst", label: "Studia Niestacjonarne" },
    { value: "nst_puw", label: "Studia Niestacjonarne PUW" }
  ];

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
  const renderGroups = () => {
    if (!selection.plan || !plans[selection.plan]) {
      return <option value="">Najpierw wybierz plan</option>;
    }

    const selectedPlan = plans[selection.plan];
    return (
      <>
        <option value="">Wybierz grupę</option>
        {Object.keys(selectedPlan.groups).map(groupName => (
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
          setPlans(data); // Ustaw tablicę planów
          setError(null);
        } catch (err) {
          console.error('Error loading plans:', err);
          setError('Nie udało się załadować planów');
          setPlans([]); // Ustaw pustą tablicę w przypadku błędu
        } finally {
          setLoading(false);
        }
      }
    };
    loadPlans();
  }, [selection.category, selection.faculty]);

  const handleSelectionChange = (field: keyof SelectionState, value: string) => {
    const newSelection = { ...selection, [field]: value };
    
    // Reset dependent fields
    if (field === 'category') {
      delete newSelection.faculty;
      delete newSelection.plan;
      delete newSelection.group;
    } else if (field === 'faculty') {
      delete newSelection.plan;
      delete newSelection.group;
    } else if (field === 'plan') {
      delete newSelection.group;
    }

    setSelection(newSelection);
    onSelectionChange(newSelection);
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
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="select-wrapper">
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

      <div className="select-wrapper">
        <label className="block text-wspia-gray font-medium mb-2">
          Wybierz kierunek:
        </label>
        <select
          className="w-full p-3 border rounded-lg shadow-sm focus:border-wspia-red focus:ring-1 focus:ring-wspia-red"
          value={selection.faculty || ''}
          onChange={(e) => handleSelectionChange('faculty', e.target.value)}
          disabled={!selection.category || loading}
        >
          <option value="">
            {!selection.category ? 'Najpierw wybierz tryb studiów' : 'Wybierz kierunek'}
          </option>
          {faculties.map((faculty) => (
            <option key={faculty} value={faculty}>{faculty}</option>
          ))}
        </select>
      </div>

      <div className="select-wrapper">
        <label className="block text-wspia-gray font-medium mb-2">
          Wybierz plan:
        </label>
        <select
          className="w-full p-3 border rounded-lg shadow-sm focus:border-wspia-red focus:ring-1 focus:ring-wspia-red"
          value={selection.plan || ''}
          onChange={(e) => handleSelectionChange('plan', e.target.value)}
          disabled={!selection.faculty}
        >
          <option value="">
            {selection.faculty ? 'Wybierz plan' : 'Najpierw wybierz kierunek'}
          </option>
          {Object.values(plans).map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>

      <div className="select-wrapper">
        <label className="block text-wspia-gray font-medium mb-2">
          Wybierz grupę:
        </label>
        <select
          className="w-full p-3 border rounded-lg shadow-sm focus:border-wspia-red focus:ring-1 focus:ring-wspia-red"
          value={selection.group || ''}
          onChange={(e) => handleSelectionChange('group', e.target.value)}
          disabled={!selection.plan}
        >
          {renderGroups()}
        </select>
      </div>
    </div>
  );
};
