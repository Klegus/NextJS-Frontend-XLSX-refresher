'use client';

import { loginWithMicrosoft } from '@/lib/msauth';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam) setError(decodeURIComponent(errorParam));
  }, [searchParams]);

  const handleLogin = async () => {
    try {
      await loginWithMicrosoft();
    } catch (err: any) {
      setError(err?.message || 'Wystąpił błąd podczas logowania. Spróbuj ponownie.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-white rounded-2xl shadow-glass ring-1 ring-black/[0.04] overflow-hidden">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAvu7fXk3m4Lz5iwLKJHAPKlelKnT8CjI-Bg&s"
            alt="WSPA Logo"
            className="w-14 h-14 object-contain"
          />
        </div>

        {/* Card */}
        <div className="glass-card p-8 mb-6">
          <h1 className="text-xl font-bold text-ink mb-2 tracking-tight">
            Plan Zajęć WSPA
          </h1>
          <p className="text-sm text-ink-muted leading-relaxed mb-6">
            Zaloguj się kontem uczelnianym, aby zobaczyć plan zajęć.
          </p>

          {error && (
            <div className="bg-wspia-red/[0.06] ring-1 ring-wspia-red/15 rounded-lg p-3 mb-4 text-left">
              <p className="text-xs text-wspia-red">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-ink text-white rounded-xl flex items-center justify-center gap-3 hover:bg-ink/85 transition-all font-medium text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1H11V11H1V1Z" fill="#F25022" />
              <path d="M12 1H22V11H12V1Z" fill="#7FBA00" />
              <path d="M1 12H11V22H1V12Z" fill="#00A4EF" />
              <path d="M12 12H22V22H12V12Z" fill="#FFB900" />
            </svg>
            <span>Zaloguj się przez Microsoft</span>
          </button>

          <p className="text-[0.6875rem] text-ink-muted/60 mt-4">
            Użyj konta @wspa.pl lub @student.wspa.pl
          </p>
        </div>

        <p className="text-[0.6875rem] text-ink-muted/40 tracking-widest uppercase font-medium">
          WSPA Lublin · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-wspia-red border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
