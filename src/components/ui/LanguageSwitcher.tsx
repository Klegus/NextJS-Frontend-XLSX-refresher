'use client';

import { LANGS, useLanguage } from '@/i18n';
import type { Lang } from '@/i18n';

// Language code "uk" is the ISO 639-1 code for Ukrainian; users know it as UA
const LABELS: Record<Lang, string> = { pl: 'PL', en: 'EN', uk: 'UA' };

// Inline SVG flags – emoji flags do not render on Windows
const Flag: React.FC<{ lang: Lang }> = ({ lang }) => {
  const common = { width: 20, height: 14, viewBox: '0 0 60 40', className: 'rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)] shrink-0', 'aria-hidden': true };
  if (lang === 'pl') {
    return (
      <svg {...common}>
        <rect width="60" height="20" fill="#fff" />
        <rect y="20" width="60" height="20" fill="#dc143c" />
      </svg>
    );
  }
  if (lang === 'uk') {
    return (
      <svg {...common}>
        <rect width="60" height="20" fill="#0057b7" />
        <rect y="20" width="60" height="20" fill="#ffd700" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#c8102e" strokeWidth="3" />
      <path d="M30 0V40M0 20H60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0V40M0 20H60" stroke="#c8102e" strokeWidth="7" />
    </svg>
  );
};

// Language switcher in the top-right corner of every page (choice kept in localStorage)
export const LanguageSwitcher: React.FC = () => {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t('lang.label')}
      className="absolute top-3 right-3 z-40 glass-card !rounded-full flex items-center gap-0.5 p-1"
    >
      {LANGS.map(code => {
        const active = code === lang;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={active}
            aria-label={t(`lang.${code}`)}
            title={t(`lang.${code}`)}
            lang={code}
            className={`!border-none !shadow-none !rounded-full flex items-center justify-center w-8 h-7 hover:!translate-y-0 transition-opacity ${
              active ? '!bg-wspia-red/10 ring-1 ring-wspia-red/40 opacity-100' : '!bg-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <Flag lang={code} />
            <span className="sr-only">{LABELS[code]}</span>
          </button>
        );
      })}
    </div>
  );
};
