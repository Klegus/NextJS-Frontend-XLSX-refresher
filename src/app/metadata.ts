import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plan Zajęć WSPA Lublin - Nieoficjalny Rozkład Zajęć | WSPA',
  description: 'Nieoficjalny plan zajęć Wyższej Szkoły Prawa i Administracji w Lublinie. Sprawdź aktualny rozkład zajęć dla studiów stacjonarnych i niestacjonarnych. Informatyka, Prawo, Administracja - wszystkie kierunki WSPA.',
  keywords: 'WSPA Lublin, plan zajęć WSPA, rozkład zajęć WSPA, Wyższa Szkoła Prawa i Administracji, studia Lublin, informatyka WSPA, prawo WSPA, administracja WSPA, plan lekcji WSPA, harmonogram zajęć, studia stacjonarne Lublin, studia niestacjonarne Lublin',
  authors: [{ name: 'WSPA Schedule Tool' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    url: 'https://planinf.pl',
    siteName: 'Plan Zajęć WSPA Lublin',
    title: 'Plan Zajęć WSPA - Nieoficjalny Rozkład Zajęć',
    description: 'Sprawdź aktualny plan zajęć na Wyższej Szkole Prawa i Administracji w Lublinie. Wszystkie kierunki, grupy i specjalizacje.',
    images: [
      {
        url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAvu7fXk3m4Lz5iwLKJHAPKlelKnT8CjI-Bg&s',
        width: 800,
        height: 600,
        alt: 'WSPA Lublin Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plan Zajęć WSPA Lublin',
    description: 'Nieoficjalny plan zajęć WSPiA - sprawdź rozkład zajęć',
  },
  alternates: {
    canonical: 'https://planinf.pl',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  other: {
    'msapplication-TileColor': '#dc2626',
    'theme-color': '#dc2626',
  },
};

// Dynamic metadata for specific pages
export function generateMetadata({ searchParams }: { searchParams: any }): Metadata {
  const faculty = searchParams?.faculty;
  const group = searchParams?.group;

  let title = 'Plan Zajęć WSPA Lublin';
  let description = 'Nieoficjalny plan zajęć Wyższej Szkoły Prawa i Administracji w Lublinie';

  if (faculty) {
    title = `Plan Zajęć ${faculty} - WSPA Lublin`;
    description = `Plan zajęć kierunku ${faculty} na WSPA w Lublinie. Sprawdź rozkład zajęć, sale i prowadzących.`;
  }

  if (group) {
    title = `${group} - Plan Zajęć WSPA Lublin`;
    description = `Plan zajęć dla grupy ${group} na WSPA w Lublinie. Aktualny rozkład zajęć z podziałem na dni tygodnia.`;
  }

  return {
    title,
    description,
  };
}