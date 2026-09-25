import DOMPurify from 'dompurify';

let hooked = false;

// HTML from the backend (plan tables, Moodle announcements) is sanitised before
// it is inserted with dangerouslySetInnerHTML: the backend already escapes cell
// text, this is the second layer (scripts, event handlers, javascript: URLs).
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  // Server render: the data is fetched in the browser, nothing to show yet
  if (typeof window === 'undefined') return '';
  if (!hooked) {
    DOMPurify.addHook('afterSanitizeAttributes', node => {
      if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });
    hooked = true;
  }
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, ADD_ATTR: ['target'] });
}
