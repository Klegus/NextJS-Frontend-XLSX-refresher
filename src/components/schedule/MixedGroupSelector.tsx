'use client';

import { useState, useEffect } from 'react';
import { PlanGroup } from '@/types/schedule';

interface MixedGroupSelectorProps {
  planData: PlanGroup;
  onSelectionChange: (selectedGroups: string[]) => void;
  initialSelection?: string[];
}

export const MixedGroupSelector: React.FC<MixedGroupSelectorProps> = ({
  planData,
  onSelectionChange,
  initialSelection = []
}) => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>(() => {
    // Load saved selection from localStorage
    if (typeof window !== 'undefined') {
      const savedKey = `mixed_selection_${planData.id}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return initialSelection;
        }
      }
    }
    return initialSelection;
  });

  // Convert groups object to array if needed
  const groupsList = Array.isArray(planData.groups)
    ? planData.groups
    : Object.keys(planData.groups || {});

  // Group groups by type for better UX
  const groupsByType = groupsList.reduce((acc, group) => {
    if (group.includes('Grupa') && !group.includes('Sp.')) {
      acc.base.push(group);
    } else if (group.includes('Sp.')) {
      acc.specialization.push(group);
    } else {
      acc.other.push(group);
    }
    return acc;
  }, { base: [] as string[], specialization: [] as string[], other: [] as string[] });

  const handleGroupToggle = (group: string) => {
    setSelectedGroups(prev => {
      const newSelection = prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group];

      // Save to localStorage
      if (typeof window !== 'undefined') {
        const savedKey = `mixed_selection_${planData.id}`;
        localStorage.setItem(savedKey, JSON.stringify(newSelection));
      }

      return newSelection;
    });
  };

  useEffect(() => {
    onSelectionChange(selectedGroups);
  }, [selectedGroups, onSelectionChange]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-wspia-red mb-2">
          Plan mieszany - wybierz swoje grupy:
        </h3>
        <p className="text-sm text-gray-600">
          Możesz wybrać dowolną kombinację grup. System automatycznie połączy plany.
        </p>
      </div>

      {groupsByType.base.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Grupa podstawowa:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {groupsByType.base.map((group: string) => {
              const columnCount = planData.groupColumnInfo?.[group];
              return (
                <label
                  key={group}
                  className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(group)}
                    onChange={() => handleGroupToggle(group)}
                    className="w-4 h-4 text-wspia-red border-gray-300 rounded focus:ring-wspia-red"
                  />
                  <span className="text-sm">
                    {group}
                    {columnCount && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({columnCount} dni)
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {groupsByType.specialization.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Specjalizacja:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {groupsByType.specialization.map((group: string) => {
              const columnCount = planData.groupColumnInfo?.[group];
              return (
                <label
                  key={group}
                  className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(group)}
                    onChange={() => handleGroupToggle(group)}
                    className="w-4 h-4 text-wspia-red border-gray-300 rounded focus:ring-wspia-red"
                  />
                  <span className="text-sm">
                    {group}
                    {columnCount && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({columnCount} dni)
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {groupsByType.other.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Inne:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {groupsByType.other.map((group: string) => {
              const columnCount = planData.groupColumnInfo?.[group];
              return (
                <label
                  key={group}
                  className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(group)}
                    onChange={() => handleGroupToggle(group)}
                    className="w-4 h-4 text-wspia-red border-gray-300 rounded focus:ring-wspia-red"
                  />
                  <span className="text-sm">
                    {group}
                    {columnCount && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({columnCount} dni)
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {selectedGroups.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            Wybrane grupy: <strong>{selectedGroups.join(', ')}</strong>
          </p>
        </div>
      )}

      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setSelectedGroups([])}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Wyczyść wybór
        </button>
        <button
          onClick={() => onSelectionChange(selectedGroups)}
          disabled={selectedGroups.length === 0}
          className={`px-6 py-2 rounded-md text-white transition-colors ${
            selectedGroups.length > 0
              ? 'bg-wspia-red hover:bg-red-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Pokaż plan ({selectedGroups.length})
        </button>
      </div>
    </div>
  );
};