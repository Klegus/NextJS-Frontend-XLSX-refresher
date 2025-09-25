/**
 * Merges multiple HTML tables from different groups into a single table
 * for mixed plans where students belong to multiple groups
 */

interface MergedCell {
  content: string[];
  groups: string[];
}

export function mergeHTMLTables(htmlPerGroup: Record<string, string>): string {
  console.log('=== Starting HTML merge ===');
  console.log('Groups to merge:', Object.keys(htmlPerGroup));

  if (Object.keys(htmlPerGroup).length === 0) {
    return '<p>Brak danych do wyświetlenia</p>';
  }

  // If only one group, return as-is
  if (Object.keys(htmlPerGroup).length === 1) {
    console.log('Only one group, returning as-is');
    return Object.values(htmlPerGroup)[0];
  }

  // Parse all HTML tables
  const parser = new DOMParser();
  const tables: { group: string; doc: Document; table: HTMLTableElement }[] = [];

  for (const [group, html] of Object.entries(htmlPerGroup)) {
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');
    if (table) {
      tables.push({ group, doc, table });
    } else {
      console.warn(`No table found in HTML for group ${group}`);
    }
  }

  if (tables.length === 0) {
    return '<p>Nie znaleziono tabel do połączenia</p>';
  }

  // Helper function to normalize time slot for comparison
  const normalizeTimeSlot = (slot: string): string => {
    // Remove all HTML tags and whitespace
    return slot.replace(/<[^>]*>/g, '').replace(/\s+/g, '');
  };

  // Helper function to extract time in minutes for sorting
  const getTimeInMinutes = (normalizedSlot: string): number => {
    const match = normalizedSlot.match(/(\d+)-/);
    if (match) {
      const timeStr = match[1];
      const hours = Math.floor(parseInt(timeStr) / 100);
      const minutes = parseInt(timeStr) % 100;
      return hours * 60 + minutes;
    }
    return 0;
  };

  // Get day headers from first table (should be same for all)
  const headerRow = tables[0].table.querySelector('tr');
  const dayHeaders = Array.from(headerRow?.cells || []).map(cell => cell.innerHTML);
  console.log('Day headers:', dayHeaders);

  // Collect all unique time slots from all tables
  const timeSlotMap = new Map<string, string>(); // normalized -> original HTML
  const allTimeSlots = new Set<string>(); // normalized slots

  tables.forEach(({ table }) => {
    const rows = Array.from(table.querySelectorAll('tr'));
    rows.forEach((row, idx) => {
      if (idx === 0) return; // Skip header
      const timeCell = row.cells[0];
      if (timeCell) {
        const originalSlot = timeCell.innerHTML.trim();
        const normalized = normalizeTimeSlot(originalSlot);
        if (!allTimeSlots.has(normalized)) {
          allTimeSlots.add(normalized);
          timeSlotMap.set(normalized, originalSlot);
        }
      }
    });
  });

  // Sort time slots chronologically
  const sortedTimeSlots = Array.from(allTimeSlots).sort((a, b) => {
    return getTimeInMinutes(a) - getTimeInMinutes(b);
  });

  console.log('Sorted time slots:', sortedTimeSlots);

  // Create merged data structure
  // Structure: normalized time -> day header -> MergedCell
  const mergedData = new Map<string, Map<string, MergedCell>>();

  // Initialize the structure
  sortedTimeSlots.forEach(normalizedTime => {
    const dayMap = new Map<string, MergedCell>();
    dayHeaders.forEach(header => {
      dayMap.set(header, { content: [], groups: [] });
    });
    mergedData.set(normalizedTime, dayMap);
  });

  // Fill with data from all tables
  tables.forEach(({ group, table }) => {
    const rows = Array.from(table.querySelectorAll('tr'));
    console.log(`Processing ${group} with ${rows.length} rows`);

    rows.forEach((row, rowIdx) => {
      if (rowIdx === 0) return; // Skip header row

      const timeCell = row.cells[0];
      if (!timeCell) return;

      const normalizedTime = normalizeTimeSlot(timeCell.innerHTML.trim());
      const dayMap = mergedData.get(normalizedTime);

      if (!dayMap) {
        console.warn(`Time slot not found in merged data: ${normalizedTime}`);
        return;
      }

      // Get the headers for this specific table (in case they're different)
      const tableHeaders = Array.from(table.querySelector('tr')?.cells || []).map(cell => cell.innerHTML);

      // Process each day column
      for (let colIdx = 1; colIdx < row.cells.length && colIdx < tableHeaders.length; colIdx++) {
        const cell = row.cells[colIdx];
        const content = cell.innerHTML.trim();
        const dayHeader = tableHeaders[colIdx];

        if (content && content !== '&nbsp;' && content !== '') {
          const mergedCell = dayMap.get(dayHeader);
          if (mergedCell) {
            // Check if this exact content already exists (avoid duplicates)
            if (!mergedCell.content.includes(content)) {
              mergedCell.content.push(content);
              mergedCell.groups.push(group);
              console.log(`Added content for ${group} at ${normalizedTime}, ${dayHeader}`);
            }
          }
        }
      }
    });
  });

  // Build the merged HTML table
  const mergedTable = document.createElement('table');
  mergedTable.className = 'min-w-full divide-y divide-gray-200';
  mergedTable.setAttribute('border', '1');

  // Create header
  const thead = document.createElement('thead');
  const headerRowElement = document.createElement('tr');

  dayHeaders.forEach((header, idx) => {
    const th = document.createElement('th');
    th.innerHTML = header.includes('<b>') ? header : `<b>${header}</b>`;
    headerRowElement.appendChild(th);
  });
  thead.appendChild(headerRowElement);
  mergedTable.appendChild(thead);

  // Create body
  const tbody = document.createElement('tbody');

  sortedTimeSlots.forEach(normalizedTime => {
    const tr = document.createElement('tr');

    // Add time slot cell (use original HTML formatting)
    const timeCell = document.createElement('td');
    timeCell.innerHTML = timeSlotMap.get(normalizedTime) || normalizedTime;
    tr.appendChild(timeCell);

    // Add day cells
    const dayMap = mergedData.get(normalizedTime);
    for (let i = 1; i < dayHeaders.length; i++) {
      const td = document.createElement('td');
      const dayHeader = dayHeaders[i];
      const mergedCell = dayMap?.get(dayHeader);

      if (mergedCell && mergedCell.content.length > 0) {
        if (mergedCell.content.length === 1) {
          // Single content - display normally
          td.innerHTML = mergedCell.content[0];
        } else {
          // Multiple contents - show all with separators
          td.innerHTML = mergedCell.content.map((content, idx) => {
            const groupLabel = mergedCell.groups[idx];
            // For cleaner display, only show group label if there's actual conflict
            return `
              <div class="${idx < mergedCell.content.length - 1 ? 'mb-2 pb-2 border-b border-gray-200' : ''}">
                <div class="text-xs text-gray-500 font-semibold mb-1">[${groupLabel}]</div>
                ${content}
              </div>
            `;
          }).join('');
          td.style.backgroundColor = '#fef3c7'; // Light yellow for conflicts
        }
      } else {
        td.innerHTML = '';
      }

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });

  mergedTable.appendChild(tbody);

  // Add info about merged groups
  const infoDiv = document.createElement('div');
  infoDiv.className = 'mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700';
  infoDiv.innerHTML = `
    <strong>Plan scalony z grup:</strong> ${Object.keys(htmlPerGroup).join(', ')}
    <br>
    <span class="text-xs">Komórki z żółtym tłem zawierają zajęcia z różnych grup występujące w tym samym czasie</span>
  `;

  // Combine table and info
  const container = document.createElement('div');
  container.appendChild(mergedTable);
  container.appendChild(infoDiv);

  return container.outerHTML;
}