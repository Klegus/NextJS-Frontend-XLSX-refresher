'use client';

import { loginWithMicrosoft } from '@/lib/msauth';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState('/');
  
  // Pobierz callbackUrl tylko po stronie klienta
  useEffect(() => {
    setCallbackUrl(searchParams?.get('callbackUrl') || '/');
  }, [searchParams]);

  useEffect(() => {
    // Check if there's an error from the auth provider
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleLogin = async () => {
    try {
      await loginWithMicrosoft();
    } catch (error: any) {
      setError(error.message || 'Wystąpił błąd podczas logowania. Spróbuj ponownie.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-full shadow-md overflow-hidden flex items-center justify-center border-4 border-blue-50">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAvu7fXk3m4Lz5iwLKJHAPKlelKnT8CjI-Bg&s"
              alt="WSPiA Logo"
              className="w-20 h-20 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4 tracking-tight">
            Plan zajęć WSPA
          </h1>
          <p className="text-gray-600 mb-6 max-w-xs mx-auto">
            Zaloguj się, aby uzyskać dostęp do planu zajęć i materiałów dydaktycznych
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            className="w-full py-4 px-4 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-lg flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 border border-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-3"
              viewBox="0 0 23 23"
              fill="none"
            >
              <path
                d="M1 1H11V11H1V1Z"
                fill="#F25022"
              />
              <path
                d="M12 1H22V11H12V1Z"
                fill="#7FBA00"
              />
              <path
                d="M1 12H11V22H1V12Z"
                fill="#00A4EF"
              />
              <path
                d="M12 12H22V22H12V12Z"
                fill="#FFB900"
              />
            </svg>
            <span className="text-lg tracking-wide">Zaloguj się przez uczelniany email Office</span>
          </button>
          
          <div className="text-center text-sm text-gray-500 mt-4">
            <p>Aby uzyskać dostęp, użyj swojego konta uczelnianego</p>
          </div>
        </div>
      </div>
      
      <div className="mt-10 text-center">
        <p className="text-sm text-gray-600 mb-1">© {new Date().getFullYear()} WSPA</p>
        <p className="text-xs text-gray-500">Wszystkie prawa zastrzeżone</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <p>Ładowanie...</p>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
