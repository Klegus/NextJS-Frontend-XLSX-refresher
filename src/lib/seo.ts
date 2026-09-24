import { getSiteUrl } from './access';

// Everything search engines and link previews show about the site, in one place
export const SITE_NAME = 'Plan zajęć WSPA Lublin';
export const SITE_DESCRIPTION =
  'Aktualny plan zajęć Wyższej Szkoły Prawa i Administracji w Lublinie: wszystkie kierunki, tryby studiów i grupy, ' +
  'terminarz egzaminów i zaliczeń oraz subskrypcja planu w kalendarzu telefonu.';

export const FACULTIES = [
  'Administracja', 'Architektura', 'Finanse i rachunkowość', 'Gospodarka przestrzenna', 'Informatyka',
  'Media i dziennikarstwo', 'Pedagogika przedszkolna i wczesnoszkolna', 'Pielęgniarstwo', 'Praca socjalna',
  'Projektowanie wnętrz', 'Socjologia', 'Stosunki międzynarodowe', 'Transport', 'Zarządzanie',
];

export function structuredData() {
  const url = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${url}/#website`,
        url,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: ['pl-PL', 'en', 'uk'],
      },
      {
        '@type': 'WebApplication',
        '@id': `${url}/#app`,
        name: SITE_NAME,
        url,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' },
        about: FACULTIES.map(name => ({ '@type': 'Thing', name: `${name} – WSPA Lublin` })),
        provider: {
          '@type': 'CollegeOrUniversity',
          name: 'Wyższa Szkoła Prawa i Administracji w Lublinie',
          alternateName: 'WSPA Lublin',
          url: 'https://wspa.pl',
          address: { '@type': 'PostalAddress', addressLocality: 'Lublin', addressCountry: 'PL' },
        },
      },
    ],
  };
}
