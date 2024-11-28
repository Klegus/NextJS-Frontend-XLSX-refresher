import { useEffect, useState } from 'react';
import Image from 'next/image';

export const MaintenancePage: React.FC = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100
             flex flex-col items-center justify-center p-4"> 
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <Image
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAvu7fXk3m4Lz5iwLKJHAPKlelKnT8CjI-Bg&s"
            alt="WSPiA Logo"
            width={128}
            height={128}
            className="mx-auto"
          />
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
          <h1 className="text-4xl font-bold mb-6 text-gray-800">
            Przerwa Techniczna
          </h1>

          <div className="text-6xl mb-6 text-gray-600">
            🔧
          </div>

          <p className="text-lg text-gray-700 mb-4">
            Przepraszamy, ale aktualnie trwają prace techniczne nad planem zajęć.
          </p>

          <div className="text-gray-600 animate-pulse">
            Trwa aktualizacja systemu{dots}
          </div>
        </div>

        <p className="text-sm text-gray-500">
          System zostanie przywrócony automatycznie po zakończeniu prac technicznych.
        </p>
      </div> 
    </div>
  );
};