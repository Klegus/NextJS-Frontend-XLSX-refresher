import { Plan, WeekRange } from '@/types/schedule';
import { censorLecturerNamesInHtml, isCensorshipEnabled } from '../../utils/censor';

export function filterPlanForCurrentWeek(
  planHtml: string,
  weekRange: WeekRange,
  category: string | null
): string {
  // Apply name censorship only if it's enabled globally via environment variable
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_CENSORSHIP === 'true') {
    planHtml = censorLecturerNamesInHtml(planHtml);
  }
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(planHtml, 'text/html');
  const table = doc.querySelector('table');

  if (!table) return planHtml;

  const rows = table.querySelectorAll('tr');
  const headerRow = rows[0];
  const headerCells = headerRow.querySelectorAll('th');

  // Define days configuration based on category
  const daysConfig = {
    nst: {
      startDay: 5, // Saturday
      numberOfDays: 2, // Saturday, Sunday
      dayNames: ['Godziny', 'Sobota', 'Niedziela'],
    },
    nst_puw: {
      startDay: 5, // Saturday
      numberOfDays: 2, // Saturday, Sunday
      dayNames: ['Godziny', 'Sobota', 'Niedziela'],
    },
    st: {
      startDay: 0, // Monday
      numberOfDays: 5, // Monday-Friday
      dayNames: ['Godziny', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'],
    },
  };

  const config = daysConfig[category as keyof typeof daysConfig] || daysConfig.st;

  // Update headers with dates
  headerCells.forEach((cell, index) => {
    if (index > 0 && index <= config.numberOfDays) {
      const dayOfWeek = config.startDay + (index - 1);
      const date = new Date(weekRange.start);
      date.setDate(weekRange.start.getDate() + dayOfWeek);
      const originalText = cell.textContent?.split('(')[0].trim() || '';
      cell.textContent = `${originalText} (${formatDate(date)})`;
    }
  });

  // Filter rows with lessons
  Array.from(rows).slice(1).forEach(row => {
    const cells = row.querySelectorAll('td');
    let hasLessonsInWeek = false;

    cells.forEach((cell, cellIndex) => {
      if (cellIndex === 0) return; // Skip time column

      if (cellIndex > config.numberOfDays) {
        cell.style.display = 'none';
        return;
      }

      const cellContent = cell.innerHTML;
      if (cellContent && cellContent.trim() !== '') {
        const dayOfWeek = config.startDay + (cellIndex - 1);
        const currentDate = new Date(weekRange.start);
        currentDate.setDate(weekRange.start.getDate() + dayOfWeek);
        const dateStr = formatDate(currentDate);

        if (!cellContent.includes(dateStr)) {
          cell.innerHTML = '';
        } else {
          hasLessonsInWeek = true;
        }
      }
    });

    if (!hasLessonsInWeek) {
      row.style.display = 'none';
    }
  });

  return table.outerHTML;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
  });
}