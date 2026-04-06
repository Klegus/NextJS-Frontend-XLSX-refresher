export const MaintenancePage: React.FC = () => {

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-white rounded-2xl shadow-glass ring-1 ring-black/[0.04] overflow-hidden">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAvu7fXk3m4Lz5iwLKJHAPKlelKnT8CjI-Bg&s"
            alt="WSPiA Logo"
            className="w-14 h-14 object-contain"
          />
        </div>

        {/* Card */}
        <div className="glass-card p-8 mb-6">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-wspia-red/[0.06] ring-1 ring-wspia-red/15">
            <span className="w-1.5 h-1.5 rounded-full bg-wspia-red animate-pulse" />
            <span className="text-xs font-semibold text-wspia-red tracking-wide uppercase">Przerwa techniczna</span>
          </div>

          <h1 className="text-xl font-bold text-ink mb-3 tracking-tight">
            Aktualizacja systemu
          </h1>

          <p className="text-sm text-ink-muted leading-relaxed mb-6">
            Trwają prace techniczne nad planem zajęć.
            System zostanie przywrócony automatycznie.
          </p>

          {/* Loading dots */}
          <div className="flex items-center justify-center gap-2.5">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-wspia-red"
                  style={{
                    animation: 'dotBounce 1.4s infinite ease-in-out both',
                    animationDelay: `${i * 0.16}s`
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-ink-muted">
              Trwa aktualizacja
            </span>
          </div>
        </div>

        <p className="text-[0.6875rem] text-ink-muted/40 tracking-widest uppercase font-medium">
          WSPA Lublin
        </p>
      </div>

      <style jsx>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
