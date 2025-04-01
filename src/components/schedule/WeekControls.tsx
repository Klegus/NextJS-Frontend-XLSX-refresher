interface WeekControlsProps {
    onPrevWeek: () => void;
    onNextWeek: () => void;
    currentWeek: { start: Date; end: Date };
    isPrevDisabled: boolean;
    isNextDisabled: boolean;
    planHtml?: string; // HTML planu, potrzebny do eksportu
    mergeEnabled?: boolean; // Informacja, czy łączenie komórek jest włączone
    isFilteringEnabled?: boolean; // Informacja, czy filtrowanie jest włączone
    onFilterToggle?: (value: boolean) => void; // Callback do zmiany stanu filtrowania
    onMergeToggle?: (value: boolean) => void; // Callback do zmiany stanu łączenia komórek
  }
  
  export const WeekControls: React.FC<WeekControlsProps> = ({
    onPrevWeek,
    onNextWeek,
    currentWeek,
    isPrevDisabled,
    isNextDisabled,
    planHtml,
    mergeEnabled = true,
    isFilteringEnabled = false,
    onFilterToggle,
    onMergeToggle
  }) => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
      });
    };
  
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-white rounded-lg shadow-sm mb-4 flex-wrap gap-2">
        <div className="flex justify-between w-full sm:w-auto sm:space-x-2">
          <button
            onClick={onPrevWeek}
            disabled={isPrevDisabled}
            className="px-4 py-2 text-wspia-red border-2 border-wspia-red rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← <span className="hidden sm:inline">Poprzedni tydzień</span>
            <span className="sm:hidden">Poprzedni</span>
          </button>
  
          <button
            onClick={onNextWeek}
            disabled={isNextDisabled}
            className="sm:ml-2 px-4 py-2 text-wspia-red border-2 border-wspia-red rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed order-last sm:order-none"
          >
            <span className="hidden sm:inline">Następny tydzień</span>
            <span className="sm:hidden">Następny</span> →
          </button>
        </div>
        
        <div className="text-center font-medium flex-grow mx-2">
          {formatDate(currentWeek.start)} - {formatDate(currentWeek.end)}
        </div>
        
        {planHtml && (
          <button
            onClick={() => exportToCalendar(planHtml, currentWeek, mergeEnabled, isFilteringEnabled)}
            className="px-4 py-2 text-wspia-red border-2 border-wspia-red rounded-lg hover:bg-wspia-red  transition-colors"
          >
            <span className="hidden sm:inline">Eksportuj do kalendarza</span>
            <span className="sm:inline sm:hidden">Eksportuj</span>
          </button>
        )}
      </div>
    );
  };
  
  // Funkcja do eksportu zajęć do kalendarza
  import { showToast } from '@/components/ui/toast';
  
  const exportToCalendar = (planHtml: string, weekRange: { start: Date; end: Date }, mergeEnabled: boolean = true, isFilteringEnabled: boolean = false) => {
    try {
      console.log("Rozpoczynam eksport planu zajęć do kalendarza");
      console.log("Wartość parametru isFilteringEnabled:", isFilteringEnabled);
      console.log("Wartość parametru mergeEnabled:", mergeEnabled);
      
      // Zamiast użyć planHtml z props, pobieramy bezpośrednio aktualny stan tabeli z DOM
      // W ten sposób otrzymujemy dokładnie to, co użytkownik widzi na ekranie,
      // z zastosowanymi już filtrami i zmergowanymi komórkami
      const liveTable = document.querySelector('#plan-content table');
      
      if (!liveTable) {
        console.error("Nie znaleziono tabeli na stronie");
        showToast({ message: "Nie znaleziono planu zajęć do eksportu", type: "error" });
        return;
      }
      
      console.log("Znaleziono tabelę z zajęciami w DOM");
      
      const events: Array<{
        title: string;
        startDate: string;
        endDate: string;
        location: string;
        description: string;
        color?: string;
      }> = [];
      
      // Mapa kolorów dla przedmiotów
      const subjectColors: { [key: string]: string } = {};
      const colors = [
        "#4285F4", // Google Blue
        "#EA4335", // Google Red
        "#FBBC05", // Google Yellow
        "#34A853", // Google Green
        "#8E44AD", // Purple
        "#16A085", // Green Sea
        "#F39C12", // Orange
        "#E74C3C", // Red
        "#2E86C1", // Ocean Blue
        "#28B463", // Nephritis Green
        "#D35400", // Pumpkin
        "#A569BD", // Amethyst
        "#CB4335", // Red Brick
        "#117A65", // Dark Green Sea
        "#F1C40F", // Yellow
        "#3498DB"  // Peter River
      ];
      let colorIndex = 0;
      
      // Sprawdź, czy tabela ma wiersze
      const rows = liveTable.querySelectorAll('tr');
      if (!rows || rows.length <= 1) {
        showToast({ message: "Tabela nie zawiera wierszy z danymi", type: "error" });
        return;
      }
      
      // Dla tabeli z DOM możemy od razu pomijać ukryte komórki - są one już przefiltrowane
      // w widoku, więc nie musimy robić dodatkowego filtrowania
      console.log(`Liczba wierszy w tabeli: ${rows.length}`);
      
      // Informujemy użytkownika o trybie eksportu
      if (isFilteringEnabled) {
        showToast({ 
          message: "Eksportuję plan zgodnie z aktualnym widokiem (tylko zajęcia z bieżącego tygodnia)", 
          type: "info" 
        });
      } else {
        showToast({ 
          message: "Eksportuję wszystkie zajęcia z planu", 
          type: "info" 
        });
      }
      
      const headerRow = rows[0];
      const headerCells = headerRow.querySelectorAll('th');
      
      // Zbierz daty z nagłówków
      const dates: string[] = [];
      headerCells.forEach((cell, index) => {
        if (index > 0) {
          // Próbujemy dopasować format daty (xx.xx)
          const dateMatch = cell.textContent?.match(/\((\d{2}\.\d{2})\)/);
          if (dateMatch && dateMatch[1]) {
            const [day, month] = dateMatch[1].split(".");
            const year = weekRange.start.getFullYear();
            dates.push(`${year}-${month}-${day}`);
          } else {
            // Format fallbackowy, jeśli nie ma daty w nagłówku
            if (index <= 5) { // Tylko dni tygodnia (pon-pt)
              const dayOffset = index - 1;
              const date = new Date(weekRange.start);
              date.setDate(weekRange.start.getDate() + dayOffset);
              
              const day = date.getDate().toString().padStart(2, '0');
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const year = date.getFullYear();
              
              dates.push(`${year}-${month}-${day}`);
            }
          }
        }
      });
      
      if (dates.length === 0) {
        console.log("Nie znaleziono dat w nagłówkach");
        showToast({ message: "Nie znaleziono dat w nagłówkach tabeli", type: "error" });
        return;
      }
      
      // Mapa czasu dla komórek z godziną zajęć (pierwszy wiersz)
      const timeRanges: { start: string, end: string }[] = [];
      
      // Najpierw zbieramy wszystkie przedziały czasowe z pierwszej kolumny
      console.log("Rozpoczynam analizę przedziałów czasowych z tabeli");
      
      for (let i = 1; i < rows.length; i++) {
        const timeCell = rows[i].querySelector('td:first-child');
        if (!timeCell) {
          console.warn(`Brak komórki czasu dla wiersza ${i}`);
          continue;
        }
        
        // Pobierz tekst i wyczyść z HTML tagów
        const timeText = timeCell.textContent?.replace(/\s+/g, ' ').trim() || '';
        
        // Próbujemy znaleźć liczby w formacie "8 - 9"
        let startHour = -1;
        let endHour = -1;
        let startMinute = 0;
        let endMinute = 0;
        
        // Sprawdź format z superscriptem, np. "8¹⁵ - 9⁰⁰"
        const superscriptTimeMatch = timeText.match(/^(\d+)(?:[⁰¹²³⁴⁵⁶⁷⁸⁹]+|\^(\d+))?\s*[-–]\s*(\d+)(?:[⁰¹²³⁴⁵⁶⁷⁸⁹]+|\^(\d+))?/);
        
        if (superscriptTimeMatch) {
          startHour = parseInt(superscriptTimeMatch[1]);
          endHour = parseInt(superscriptTimeMatch[3]);
          
          // Próbujemy wydobyć minuty z superscriptu
          if (superscriptTimeMatch[2]) {
            startMinute = parseInt(superscriptTimeMatch[2]);
          } else {
            // Spróbuj znaleźć superskrypty
            const startSupText = timeText.substring(superscriptTimeMatch[1].length, timeText.indexOf('-')).trim();
            const startSupMatch = startSupText.match(/([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/);
            if (startSupMatch) {
              // Konwertuj znaki superscript na normalne cyfry
              const supToNum: {[key: string]: string} = {
                '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
                '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9'
              };
              let startMinStr = '';
              for (const char of startSupMatch[1]) {
                startMinStr += supToNum[char] || '';
              }
              startMinute = parseInt(startMinStr);
            }
          }
          
          if (superscriptTimeMatch[4]) {
            endMinute = parseInt(superscriptTimeMatch[4]);
          } else {
            // Podobnie dla godziny końcowej
            const endPartText = timeText.substring(timeText.indexOf('-') + 1).trim();
            const endHourEnd = endPartText.indexOf(' ') > -1 ? endPartText.indexOf(' ') : endPartText.length;
            const endSupText = endPartText.substring(endPartText.indexOf(superscriptTimeMatch[3]) + superscriptTimeMatch[3].length, endHourEnd);
            const endSupMatch = endSupText.match(/([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/);
            if (endSupMatch) {
              const supToNum: {[key: string]: string} = {
                '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
                '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9'
              };
              let endMinStr = '';
              for (const char of endSupMatch[1]) {
                endMinStr += supToNum[char] || '';
              }
              endMinute = parseInt(endMinStr);
            }
          }
        } 
        // Jeśli to zawiedzie, pobierz dowolne dwie cyfry
        else {
          const digits = timeText.match(/\d+/g);
          if (digits && digits.length >= 2) {
            startHour = parseInt(digits[0]);
            endHour = parseInt(digits[1]);
          }
        }
        
        console.log(`Analizuję czas wiersza ${i}: "${timeText}" -> godzina start: ${startHour}:${startMinute}, koniec: ${endHour}:${endMinute}`);
        
        // Jeśli znalazłeś liczby i są to rozsądne godziny (0-23)
        if (startHour >= 0 && startHour <= 23 && endHour >= 0 && endHour <= 23) {
          const startHourStr = startHour.toString().padStart(2, '0');
          const startMinStr = startMinute.toString().padStart(2, '0');
          const endHourStr = endHour.toString().padStart(2, '0');
          const endMinStr = endMinute.toString().padStart(2, '0');
          
          timeRanges[i] = {
            start: `${startHourStr}:${startMinStr}:00`,
            end: `${endHourStr}:${endMinStr}:00`
          };
        }
      }
      
      // Jeśli nie znaleźliśmy żadnych czasów, użyj predefiniowanych
      if (Object.keys(timeRanges).length === 0) {
        const hardcodedHours = [
          { start: "08:15:00", end: "09:00:00" }, // 8¹⁵-9⁰⁰
          { start: "09:05:00", end: "09:50:00" }, // 9⁰⁵-9⁵⁰
          { start: "10:00:00", end: "10:45:00" }, // 10⁰⁰-10⁴⁵
          { start: "10:50:00", end: "11:35:00" }, // 10⁵⁰-11³⁵
          { start: "11:45:00", end: "12:30:00" }, // 11⁴⁵-12³⁰
          { start: "12:35:00", end: "13:20:00" }, // 12³⁵-13²⁰
          { start: "13:30:00", end: "14:15:00" }, // 13³⁰-14¹⁵
          { start: "14:20:00", end: "15:05:00" }, // 14²⁰-15⁰⁵
          { start: "15:15:00", end: "16:00:00" }, // 15¹⁵-16⁰⁰
          { start: "16:05:00", end: "16:50:00" }, // 16⁰⁵-16⁵⁰
          { start: "17:00:00", end: "17:45:00" }, // 17⁰⁰-17⁴⁵
          { start: "17:50:00", end: "18:35:00" }, // 17⁵⁰-18³⁵
          { start: "18:45:00", end: "19:30:00" }, // 18⁴⁵-19³⁰
          { start: "19:35:00", end: "20:20:00" }, // 19³⁵-20²⁰
          { start: "20:30:00", end: "21:15:00" }  // 20³⁰-21¹⁵
        ];
        
        for (let i = 1; i < rows.length && (i-1) < hardcodedHours.length; i++) {
          timeRanges[i] = hardcodedHours[i-1];
        }
        
        console.log("Używam domyślnych godzin dla planu zajęć");
        showToast({ message: "Używam domyślnych godzin dla planu zajęć", type: "warning" });
      }
      
      // Teraz zbieramy wszystkie zajęcia z tabeli
      for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        // Pomijamy wiersze z display: none - nie powinny być już widoczne w DOM, ale na wszelki wypadek
        if (row.style.display === 'none') continue;
        
        if (!timeRanges[rowIndex]) continue;
        
        const { start: startTime, end: endTime } = timeRanges[rowIndex];
        
        // Iterujemy przez dni tygodnia (kolumny)
        for (let dayIndex = 0; dayIndex < dates.length; dayIndex++) {
          const cellIndex = dayIndex + 1; // +1 bo pierwsza kolumna to godziny
          if (cellIndex >= row.cells.length) continue;
          
          const cell = row.cells[cellIndex];
          // Pomijamy ukryte komórki - nie powinny być już widoczne w DOM, ale na wszelki wypadek
          if (cell.style.display === 'none') continue;
          
          const cellContent = cell.innerHTML.trim();
          if (cellContent && cellContent !== "") {
            // Oblicz efektywny czas zakończenia dla komórek z rowSpan
            let effectiveEndTime = endTime;
            
            if (cell.rowSpan && cell.rowSpan > 1) {
              // Znajdź ostatni wiersz objęty przez rowSpan
              const lastRowIndex = rowIndex + cell.rowSpan - 1;
              if (lastRowIndex < rows.length && timeRanges[lastRowIndex]) {
                effectiveEndTime = timeRanges[lastRowIndex].end;
              }
            }
            
            // Pobierz pełną treść komórki
            let description = cell.textContent?.trim() || "";
            
            // Określ tytuł zajęć - staramy się wyodrębnić nazwę przedmiotu
            let title = "";
            
            // Najpierw szukamy tekstu wewnątrz znacznika <strong>
            let strongMatch = null;
            if (cell.querySelector('strong')) {
              const strongText = cell.querySelector('strong')?.textContent?.trim();
              if (strongText) {
                // Usuń ewentualne znaki nowej linii
                strongMatch = strongText.replace(/\n/g, ' ').trim();
              }
            }
            
            if (strongMatch) {
              // Wzorzec 1: Z prefiksem "Sp."
              const spMatch = strongMatch.match(/^(?:Sp\.?:\s*)?(.*?)$/);
              if (spMatch && spMatch[1]) {
                title = spMatch[1].trim();
                // Jeśli rzeczywiście jest prefix "Sp.:", to zachowaj go w tytule
                if (strongMatch.startsWith("Sp.")) {
                  title = "Sp.: " + title;
                }
              }
            } 
            // Jeśli nie znaleziono w <strong>, próbuj w całym tekście
            else {
              // Wzorzec 1: Wyszukaj "Sp.: Nazwa przedmiotu" lub "Nazwa przedmiotu"
              const spMatch = description.match(/(?:Sp\.?:\s*)?(.*?)(?:\s*[-–]\s*|\s*$)/);
              if (spMatch && spMatch[1]) {
                title = spMatch[1].trim();
                // Jeśli rzeczywiście jest prefix "Sp.:", to zachowaj go w tytule
                if (description.indexOf("Sp.:") === 0) {
                  title = "Sp.: " + title;
                }
              } 
              // Wzorzec 2: Jeśli komórka zaczyna się od nazwy przedmiotu bez specjalnego formatu
              else if (description.length > 0) {
                const firstLine = description.split('\n')[0];
                title = firstLine.length > 50 ? firstLine.substring(0, 47) + "..." : firstLine;
              } 
              // Wzorzec 3: Fallback - użyj pierwsze 30 znaków
              else {
                title = description.substring(0, 30);
                if (description.length > 30) title += "...";
              }
            }
            
            // Znajdź lokalizację (sala)
            let location = "";
            const salaMatch = description.match(/sal[aę]\s+([^,\s]+)/i);
            if (salaMatch) {
              location = salaMatch[1].trim();
            }
            
            // Przypisz kolor na podstawie tytułu przedmiotu
            // Normalizuj nazwę przedmiotu, aby ta sama nazwa miała ten sam kolor
            // niezależnie od "Sp.:" i innych wariantów
            let baseSubjectName = title.replace(/^Sp\.?\s*:\s*/, '').split(' - ')[0].trim();
            
            // Dodaj nieco więcej debugowania
            console.log(`Przedmiot: "${title}" -> bazowa nazwa: "${baseSubjectName}"`);
            
            // Jeśli nie ma koloru dla tego przedmiotu, przypisz nowy
            if (!subjectColors[baseSubjectName]) {
              subjectColors[baseSubjectName] = colors[colorIndex % colors.length];
              colorIndex++;
              console.log(`Przypisano kolor ${subjectColors[baseSubjectName]} dla przedmiotu "${baseSubjectName}"`);
            }
            
            // Utwórz obiekt wydarzenia
            events.push({
              title,
              startDate: `${dates[dayIndex]}T${startTime}`,
              endDate: `${dates[dayIndex]}T${effectiveEndTime}`,
              location,
              description,
              color: subjectColors[baseSubjectName]
            });
          }
        }
      }
      
      if (events.length === 0) {
        console.log("Nie znaleziono zajęć do wyeksportowania");
        showToast({ message: "Brak zajęć do wyeksportowania", type: "info" });
        return;
      }
      
      console.log(`Znaleziono ${events.length} zajęć do wyeksportowania`);
      
      // Funkcja do formatowania daty w czytelnym formacie dla nazwy pliku
      const formatDateString = (date: Date) => {
        return date.toLocaleDateString('pl-PL', {
          day: '2-digit',
          month: '2-digit',
        });
      };

      // Generuj plik .ics
      const icsContent = generateIcsContent(events);
      downloadIcsFile(icsContent, `plan-zajec-${formatDateString(weekRange.start)}-${formatDateString(weekRange.end)}.ics`);
      
      showToast({ message: `Plan zajęć został pomyślnie wyeksportowany (${events.length} zajęć)`, type: "success" });
    } catch (error) {
      console.error('Błąd podczas eksportu do kalendarza:', error);
      showToast({ message: "Wystąpił błąd podczas eksportu do kalendarza", type: "error" });
    }
  };
  
  // Funkcje pomocnicze dla exportToCalendar
  const parseTimeStringFromCell = (timeStr: string): string => {
    // Przyjmuje format "9:35" i konwertuje do "09:35:00"
    const parts = timeStr.trim().split(':');
    if (parts.length !== 2) return "00:00:00";
    
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');
    return `${hours}:${minutes}:00`;
  };

  const generateIcsContent = (events: Array<{
    title: string;
    startDate: string;
    endDate: string;
    location: string;
    description: string;
    color?: string;
  }>): string => {
    // Generuje zawartość pliku ICS z podanych wydarzeń
    const ics = [
      'BEGIN:VCALENDAR', 
      'VERSION:2.0', 
      'PRODID:-//Plan Zajęć//PL',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];
    
    events.forEach(event => {
      ics.push('BEGIN:VEVENT');
      ics.push(`SUMMARY:${event.title}`);
      ics.push(`DTSTART:${formatIcsDate(event.startDate)}`);
      ics.push(`DTEND:${formatIcsDate(event.endDate)}`);
      
      // Dodaj datę utworzenia wydarzenia
      const now = new Date();
      const dtstamp = formatIcsDate(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
      ics.push(`DTSTAMP:${dtstamp}`);
      
      if (event.location) {
        ics.push(`LOCATION:${event.location}`);
      }
      
      if (event.description) {
        ics.push(`DESCRIPTION:${formatIcsDescription(event.description)}`);
      }
      
      // Dodaj kolor wydarzenia, jeśli jest podany (Google Calendar obsługuje to przez X-GOOGLE-COLOR-ID)
      if (event.color) {
        // Konwersja koloru HEX na format rozpoznawany przez Google Calendar
        ics.push(`X-APPLE-CALENDAR-COLOR:${event.color}`);
        ics.push(`COLOR:${event.color}`);
        
        // Konwertuj HEX na zdefiniowane ID kolorów Google Calendar
        // Google Calendar obsługuje tylko 11 kolorów (1-11)
        const colorID = Math.floor(Math.random() * 11) + 1;
        ics.push(`X-GOOGLE-COLOR-ID:${colorID}`);
      }
      
      // Dodaj unikalne UID dla wydarzenia
      ics.push(`UID:${generateUid()}`);
      
      // Dodaj kategorię i status wydarzenia
      ics.push('CATEGORIES:Plan Zajęć');
      ics.push('STATUS:CONFIRMED');
      
      ics.push('END:VEVENT');
    });
    
    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  };
  
  const formatIcsDate = (dateTimeString: string): string => {
    // Konwertuje YYYY-MM-DDThh:mm:ss na format ICS yyyyMMddThhmmss (bez Z)
    try {
      const [datePart, timePart] = dateTimeString.split('T');
      if (!datePart || !timePart) {
        console.error('Nieprawidłowy format daty:', dateTimeString);
        throw new Error('Nieprawidłowy format daty');
      }
      
      const [year, month, day] = datePart.split('-');
      const [hours, minutes, seconds] = timePart.split(':');
      
      if (!year || !month || !day || !hours || !minutes) {
        console.error('Nieprawidłowe komponenty daty:', { year, month, day, hours, minutes });
        throw new Error('Nieprawidłowe komponenty daty');
      }
      
      // Format ICS bez Z - to jest ważne, bo Z oznacza czas UTC, 
      // a my chcemy czas lokalny (local time)
      return `${year}${month}${day}T${hours}${minutes}${seconds || '00'}`;
    } catch (error) {
      console.error('Błąd formatowania daty ICS:', error);
      // Zwróć aktualną datę jako fallback
      const now = new Date();
      return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}00`;
    }
  };
  
  const formatIcsDescription = (description: string): string => {
    // Zamień znaki nowej linii na sekwencję '\n'
    try {
      return description
        .replace(/\n/g, '\\n')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,');
    } catch (error) {
      console.error('Błąd formatowania opisu ICS:', error);
      return "Opis niedostępny";
    }
  };
  
  const generateUid = (): string => {
    try {
      return 'planzajec-' + 
        Math.random().toString(36).substring(2, 15) + 
        Math.random().toString(36).substring(2, 15) + 
        '@plan.example.com';
    } catch (error) {
      console.error('Błąd generowania UID:', error);
      return `planzajec-${Date.now()}-${Math.floor(Math.random() * 1000000)}@plan.example.com`;
    }
  };
  
  const downloadIcsFile = (content: string, filename: string): void => {
    try {
      // Tworzy i pobiera plik ICS
      const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("Plik ICS został wygenerowany i pobrany pomyślnie");
    } catch (error) {
      console.error('Błąd podczas pobierania pliku ICS:', error);
      showToast({ message: "Nie udało się pobrać pliku ICS", type: "error" });
      
      // Próba alternatywnej metody pobierania
      try {
        const dataUrl = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(content);
        window.open(dataUrl, '_blank');
        console.log("Użyto alternatywnej metody pobierania pliku ICS");
      } catch (fallbackError) {
        console.error('Również alternatywna metoda pobierania nie powiodła się:', fallbackError);
      }
    }
  };
  
