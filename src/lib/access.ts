// One switch decides how the site is accessed (read at request time, no rebuild):
//   AUTH_MODE=sso     – sign-in with the university Microsoft account is required
//                       for every page and API; lecturers' names are shown in full
//   AUTH_MODE=public  – open to everyone; lecturers' names are shortened on the
//                       server (initials), so they never leave the backend
// Anything else than "public" means SSO - the safe default for a deployment.
export type AccessMode = 'sso' | 'public';

export function getAccessMode(): AccessMode {
  return (process.env.AUTH_MODE || '').trim().toLowerCase() === 'public' ? 'public' : 'sso';
}

export function shouldHideLecturers(): boolean {
  return getAccessMode() === 'public';
}

// Public address of the site: canonical links, sitemap, link previews and the
// OAuth redirect (SITE_URL + /api/auth/callback)
export function getSiteUrl(): string {
  return (process.env.SITE_URL || 'http://localhost:3001').replace(/\/+$/, '');
}
