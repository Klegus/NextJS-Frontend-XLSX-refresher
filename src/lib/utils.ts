export const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  export const timeSinceUpdate = (timestamp: string): string => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - updateTime.getTime()) / 1000);

    const days = Math.floor(diffInSeconds / 86400);
    const hours = Math.floor((diffInSeconds % 86400) / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);

    // For updates within the last 10 minutes, show exact time
    if (diffInSeconds < 600) {  // 600 seconds = 10 minutes
      const timeString = updateTime.toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const dateString = updateTime.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      return `${dateString} o ${timeString}`;
    }

    // For updates within the last 24 hours, show time and "X hours ago"
    if (days === 0) {
      const timeString = updateTime.toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit'
      });

      if (hours > 0) {
        return `${hours} ${hours === 1 ? 'godzinę' : hours < 5 ? 'godziny' : 'godzin'} temu (${timeString})`;
      } else if (minutes > 0) {
        return `${minutes} ${minutes === 1 ? 'minutę' : minutes < 5 ? 'minuty' : 'minut'} temu`;
      }
    }

    // For older updates, show date and how many days ago
    const dateString = updateTime.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    if (days === 1) {
      return `wczoraj (${dateString})`;
    } else if (days > 1) {
      return `${days} ${days < 5 ? 'dni' : 'dni'} temu (${dateString})`;
    }

    // Fallback - should not reach here
    return `${dateString}`;
  };
  
  export const getWeekRange = (date: Date): { start: Date; end: Date } => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return { start: startOfWeek, end: endOfWeek };
  };
  
  export const shouldShowNextWeek = (): boolean => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
  
    return (
      (currentDay === 5 && (currentHour > 21 || (currentHour === 21 && currentMinutes >= 15))) ||
      currentDay === 6 ||
      currentDay === 0
    );
  };
  
  export const convertTimeToMinutes = (timeString: string): number => {
    const cleanTimeString = timeString.replace(/<[^>]*>/g, '').trim();
    
    if (!cleanTimeString.includes(':')) {
      if (cleanTimeString.length === 3) {
        const hours = parseInt(cleanTimeString[0]);
        const minutes = parseInt(cleanTimeString.slice(1));
        return hours * 60 + minutes;
      } else if (cleanTimeString.length === 4) {
        const hours = parseInt(cleanTimeString.slice(0, 2));
        const minutes = parseInt(cleanTimeString.slice(2));
        return hours * 60 + minutes;
      }
    }
  
    const [hours, minutes] = cleanTimeString.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };
  
  export const formatMinutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  export const formatRelativeDate = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    // Check if dates are actually on the same day
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    // For updates today
    if (isToday) {
      if (diffMinutes < 60) {
        return `${diffMinutes} ${diffMinutes === 1 ? 'minutę' : diffMinutes < 5 ? 'minuty' : 'minut'} temu`;
      } else if (diffHours < 12) {
        return `${diffHours} ${diffHours === 1 ? 'godzinę' : diffHours < 5 ? 'godziny' : 'godzin'} temu`;
      } else {
        return 'dzisiaj';
      }
    } else if (isYesterday) {
      return 'wczoraj';
    } else if (diffDays === 2) {
      return 'przedwczoraj';
    } else if (diffDays < 7) {
      return `${diffDays} dni temu`;
    } else if (diffDays < 14) {
      return 'tydzień temu';
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'tydzień' : weeks < 5 ? 'tygodnie' : 'tygodni'} temu`;
    } else if (diffDays < 60) {
      return 'miesiąc temu';
    } else {
      // For older dates, show the actual date
      const dateString = date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      return dateString;
    }
  };

// Funkcje do eksportu zajęć do kalendarza
  
// Funkcja do parsowania czasu z komórki tabeli (zwraca string w formacie HH:MM)
export const parseTimeStringFromCell = (timeString: string): string => {
  // Usuń wszystkie tagi HTML
  const cleanTime = timeString.replace(/<[^>]*>/g, '').trim();
  
  // Obsługa formatu z supami (np. "8^15")
  const supMatch = cleanTime.match(/(\d{1,2})\^(\d{2})/);
  if (supMatch) {
    const hours = parseInt(supMatch[1]);
    const minutes = parseInt(supMatch[2]);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // Obsługa formatu bez dwukropka (np. "815")
  if (!cleanTime.includes(':')) {
    if (cleanTime.length === 3) {
      return `0${cleanTime[0]}:${cleanTime.substring(1, 3)}`;
    } else if (cleanTime.length === 4) {
      return `${cleanTime.substring(0, 2)}:${cleanTime.substring(2, 4)}`;
    }
  }
  
  // Jeśli czas już jest w formacie HH:MM, zwróć go bezpośrednio
  if (cleanTime.match(/\d{1,2}:\d{2}/)) {
    return cleanTime;
  }
  
  // Jeśli żaden format nie pasuje, zwróć domyślny czas
  console.warn(`Nierozpoznany format czasu: ${timeString}`);
  return '00:00';
};

// Funkcja do wyciągania tytułu zajęć z HTML
export const extractEventTitle = (html: string): string => {
  // Usuń tagi HTML
  const text = html.replace(/<[^>]*>/g, " ").trim();
  // Weź pierwszą linię jako tytuł
  return text.split("\n")[0].trim();
};

// Funkcja do wyciągania lokalizacji (sali) z HTML
export const extractEventLocation = (html: string): string => {
  const salaMatch = html.match(/sala (\d+)/i);
  return salaMatch ? `Sala ${salaMatch[1]}` : "Uczelnia";
};

// Funkcja do czyszczenia HTML - usuwa tagi HTML i normalizuje białe znaki
export const cleanEventHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, " ").trim().replace(/\s+/g, " ");
};

// Formatuje datę do formatu ICS (YYYYMMDDTHHmmssZ)
export const formatDateForIcs = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}00`;
};

// Funkcja do generowania zawartości pliku ICS
export const generateIcsContent = (events: Array<{
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
}>): string => {
  let icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PlanLekcji//PL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH"
  ];

  events.forEach(event => {
    icsContent = icsContent.concat([
      "BEGIN:VEVENT",
      `SUMMARY:${event.title}`,
      `DTSTART:${formatDateForIcs(event.startDate)}`,
      `DTEND:${formatDateForIcs(event.endDate)}`,
      `LOCATION:${event.location}`,
      `DESCRIPTION:${event.description}`,
      "END:VEVENT"
    ]);
  });

  icsContent.push("END:VCALENDAR");
  return icsContent.join("\r\n");
};

// Funkcja do pobierania pliku ICS
export const downloadIcsFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};