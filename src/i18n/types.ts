import type { pl } from './pl';

export type Lang = 'pl' | 'en' | 'uk';

// Formy mnogie wg kategorii Intl.PluralRules (pl/uk: one/few/many, en: one/other)
export interface Plural {
  one?: string;
  few?: string;
  many?: string;
  other: string;
}

type Widen<T> = {
  [K in keyof T]: T[K] extends string ? string : T[K] extends { other: string } ? Plural : Widen<T[K]>;
};

// Typ słownika wyprowadzony z pl.ts – brakujący klucz w en/uk to błąd kompilacji
export type Dict = Widen<typeof pl>;

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string | { other: string } ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type TKey = Leaves<typeof pl>;

export type TVars = Record<string, string | number>;

export type TFunction = (key: TKey, vars?: TVars) => string;
