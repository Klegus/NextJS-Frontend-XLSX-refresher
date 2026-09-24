import { censorLecturerNamesInHtml } from '../../utils/censor';
import { shouldHideLecturers } from './access';

// Server-side only: shortens lecturers' names ("dr Jan Kowalski" -> "dr J. K.")
// before the data reaches the browser, when the access mode requires it
export function protectLecturers(html: string): string {
  return shouldHideLecturers() && html ? censorLecturerNamesInHtml(html) : html;
}
