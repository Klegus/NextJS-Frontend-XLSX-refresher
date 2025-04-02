import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col justify-center items-center bg-white/80 z-50 backdrop-blur-sm">
      <div className="w-20 h-20 bg-white rounded-full shadow-xl overflow-hidden flex items-center justify-center mb-6">
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAvu7fXk3m4Lz5iwLKJHAPKlelKnT8CjI-Bg&s"
          alt="WSPiA Logo"
          className="w-16 h-16 object-contain animate-pulse"
        />
      </div>
      <div className="relative">
        <div className="w-12 h-12 border-4 border-wspia-red border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-wspia-red/30 rounded-full"></div>
      </div>
      <p className="mt-4 text-wspia-gray font-medium">Ładowanie...</p>
    </div>
  );
};