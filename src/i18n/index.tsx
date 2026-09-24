'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { pl } from './pl';
import { en } from './en';
import { uk } from './uk';
import type { Dict, Lang, Plural, TFunction, TKey, TVars } from './types';

export type { Lang, TKey, TFunction } from './types';

export const LANGS: Lang[] = ['pl', 'en', 'uk'];
export const DEFAULT_LANG: Lang = 'pl';
const STORAGE_KEY = 'uiLanguage';

const dictionaries: Record<Lang, Dict> = { pl, en, uk };

// Locale dla Intl (daty, dni tygodnia, formy mnogie)
export const LOCALES: Record<Lang, string> = {
  pl: 'pl-PL',
  en: 'en-GB',
  uk: 'uk-UA',
};

const pluralRules: Partial<Record<Lang, Intl.PluralRules>> = {};
const getPluralRules = (lang: Lang) =>
  (pluralRules[lang] ??= new Intl.PluralRules(LOCALES[lang]));

const interpolate = (text: string, vars?: TVars) =>
  vars ? text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m)) : text;

const lookup = (dict: Dict, key: string): string | Plural | undefined => {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (node && typeof node === 'object') node = (node as Record<string, unknown>)[part];
    else return undefined;
  }
  return node as string | Plural | undefined;
};

// Tłumaczenie poza Reactem (np. w funkcjach pomocniczych)
export const translate = (lang: Lang, key: TKey, vars?: TVars): string => {
  const value = lookup(dictionaries[lang], key) ?? lookup(dictionaries[DEFAULT_LANG], key);
  if (value === undefined) return key;
  if (typeof value === 'string') return interpolate(value, vars);
  const n = Number(vars?.n ?? 0);
  const category = getPluralRules(lang).select(n) as keyof Plural;
  return interpolate(value[category] ?? value.other, vars);
};

const normalizeLang = (value: string | null | undefined): Lang | null => {
  if (!value) return null;
  const code = value.toLowerCase().split(/[-_]/)[0];
  if (code === 'ua') return 'uk';
  return (LANGS as string[]).includes(code) ? (code as Lang) : null;
};

const detectInitialLang = (): Lang => {
  try {
    const saved = normalizeLang(localStorage.getItem(STORAGE_KEY));
    if (saved) return saved;
  } catch {
    // localStorage niedostępny (tryb prywatny itp.)
  }
  if (typeof navigator !== 'undefined') {
    const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const candidate of candidates) {
      const lang = normalizeLang(candidate);
      if (lang) return lang;
    }
  }
  return DEFAULT_LANG;
};

interface LanguageContextValue {
  lang: Lang;
  locale: string;
  setLang: (lang: Lang) => void;
  t: TFunction;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANG,
  locale: LOCALES[DEFAULT_LANG],
  setLang: () => {},
  t: (key, vars) => translate(DEFAULT_LANG, key, vars),
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Serwer i pierwszy render klienta zawsze po polsku – brak rozjazdu hydratacji
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    setLangState(detectInitialLang());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignorujemy – wybór zadziała do przeładowania strony
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      locale: LOCALES[lang],
      setLang,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
export const useT = () => useContext(LanguageContext).t;

// --- Dni tygodnia -----------------------------------------------------------

const POLISH_WEEKDAYS = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'];

// Nazwa dnia tygodnia (0 = poniedziałek) w danym locale, z wielkiej litery
export const weekdayName = (mondayBasedIndex: number, locale: string): string => {
  const reference = new Date(2024, 0, 1 + mondayBasedIndex); // 1.01.2024 to poniedziałek
  const name = reference.toLocaleDateString(locale, { weekday: 'long' });
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
};

// Tłumaczy polskie nazwy dni w nagłówkach tabeli planu (np. "Poniedziałek (06.10)")
export const localizeWeekdayHeaders = (html: string, lang: Lang): string => {
  if (lang === DEFAULT_LANG || !html.includes('<th')) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  let changed = false;
  doc.querySelectorAll('th').forEach(cell => {
    const text = cell.textContent || '';
    const match = text.match(/^\s*([^\s(]+)([\s\S]*)$/);
    if (!match) return;
    const index = POLISH_WEEKDAYS.indexOf(match[1].toLowerCase());
    if (index === -1) return;
    cell.textContent = `${weekdayName(index, LOCALES[lang])}${match[2]}`;
    changed = true;
  });
  return changed ? doc.body.innerHTML : html;
};
