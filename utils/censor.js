/**
 * Funkcja sprawdzająca czy cenzura powinna być włączona
 * @returns {boolean} - Czy cenzura jest włączona
 */
export function isCensorshipEnabled() {
  // Sprawdź, czy cenzura jest w ogóle wymagana w aplikacji
  // Jeśli zmienna środowiskowa NEXT_PUBLIC_ENABLE_CENSORSHIP nie jest ustawiona na "true",
  // cenzura jest całkowicie wyłączona
  var censoringEnabled = typeof process !== 'undefined' &&
                        process.env.NEXT_PUBLIC_ENABLE_CENSORSHIP === 'true';

  if (!censoringEnabled) {
    return false;
  }
  
  // Sprawdź czy jesteśmy w przeglądarce
  if (typeof window === 'undefined') {
    return true; // Po stronie serwera zawsze włączona (jeśli cenzura jest aktywna)
  }
  
  try {
    // Sprawdź czy użytkownik jest zweryfikowany
    const isVerified = localStorage.getItem('verified_email') === 'true';
    return !isVerified; // Cenzura wyłączona dla zweryfikowanych
  } catch (error) {
    console.error('Error checking censorship status:', error);
    return true; // W przypadku błędu domyślnie włączamy cenzurę
  }
}

/**
 * Funkcja cenzurująca imiona i nazwiska wykładowców
 * @param {string} fullName - Pełne imię i nazwisko z tytułem (np. "mgr Zbigniew Reszka")
 * @returns {string} - Ocenzurowane imię i nazwisko (np. "mgr Z. R.")
 */
export function censorLecturerName(fullName) {
  // Sprawdź, czy cenzura jest włączona
  const shouldCensor = isCensorshipEnabled();
  
  if (!shouldCensor) {
    return fullName;
  }
  
  // Podziel pełne imię na części
  const parts = fullName.split(' ');
  
  // Jeśli mamy mniej niż 2 części, zwróć oryginalny tekst
  if (parts.length < 2) {
    return fullName;
  }
  
  // Zakładamy, że pierwszy element to tytuł (np. "mgr")
  const title = parts[0];
  
  // Uniwersalna funkcja do przetwarzania nazwisk z myślnikiem
  const processHyphenatedName = (name) => {
    if (!name.includes('-')) {
      return `${name[0]}.`;
    }
    
    const nameParts = name.split('-');
    return nameParts.map(part => `${part[0]}.`).join('-');
  };
  
  // Inicjały imienia i nazwiska (obsługa nazwisk wieloczłonowych)
  const namesAndSurnames = parts.slice(1);
  const initials = namesAndSurnames.map(name => processHyphenatedName(name)).join(' ');
  
  // Zwróć tytuł z inicjałami
  return `${title} ${initials}`;
}

/**
 * Funkcja cenzurująca imiona i nazwiska wykładowców w treści HTML
 * @param {string} htmlContent - Treść HTML zawierająca informacje o kursach
 * @returns {string} - Treść HTML z ocenzurowanymi imionami i nazwiskami wykładowców
 */
export function censorLecturerNamesInHtml(htmlContent) {
  // Sprawdź, czy cenzura jest włączona
  const shouldCensor = isCensorshipEnabled();
  
  if (!shouldCensor || !htmlContent) {
    return htmlContent;
  }
  
  try {
    // Uproszczone podejście bez DOMParser - dla lepszej kompatybilności
    
    // Uniwersalna funkcja dla przetwarzania nazwisk z myślnikiem
    const processHyphenatedLastName = (lastName) => {
      if (!lastName.includes('-')) {
        return `${lastName[0]}.`;
      }
      
      const lastNameParts = lastName.split('-');
      return lastNameParts.map(part => `${part[0]}.`).join('-');
    };
    
    // Wzorzec dla złożonych tytułów - obsługuje np. "mgr inż. arch. Imię Nazwisko"
    let result = htmlContent.replace(
      /((?:mgr|dr|prof\.|dr hab\.|inż\.|arch\.)(?:\s+(?:mgr|dr|prof\.|dr hab\.|inż\.|arch\.))*)\s+([A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+)\s+([A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+(?:-[A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+)?)/g,
      (match, titles, firstName, lastName) => {
        const cleanTitles = titles.trim();
        return `${cleanTitles} ${firstName[0]}. ${processHyphenatedLastName(lastName)}`;
      }
    );

    // Wzorzec dla złożonych tytułów z kilkoma imionami - obsługuje np. "mgr inż. arch. Imię Drugie Nazwisko"
    result = result.replace(
      /((?:mgr|dr|prof\.|dr hab\.|inż\.|arch\.)(?:\s+(?:mgr|dr|prof\.|dr hab\.|inż\.|arch\.))*)\s+([A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+)\s+([A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+)\s+([A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+(?:-[A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+)?)/g,
      (match, titles, firstName, middleName, lastName) => {
        const cleanTitles = titles.trim();
        return `${cleanTitles} ${firstName[0]}. ${middleName[0]}. ${processHyphenatedLastName(lastName)}`;
      }
    );

    // Wzorzec dla pojedynczych tytułów - standardowe przypadki: mgr Imię Nazwisko
    result = result.replace(
      /(mgr|dr|prof\.|dr hab\.|inż\.|dr inż\.|mgr inż\.)\s+([A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+)\s+([A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+(?:-[A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+)?)/g,
      (match, title, firstName, lastName) => {
        return `${title} ${firstName[0]}. ${processHyphenatedLastName(lastName)}`;
      }
    );

    // Wzorzec dla pojedynczych tytułów z kilkoma imionami: mgr Imię Drugie Nazwisko
    result = result.replace(
      /(mgr|dr|prof\.|dr hab\.|inż\.|dr inż\.|mgr inż\.)\s+([A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+)\s+([A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+)\s+([A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+(?:-[A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+)?)/g,
      (match, title, firstName, middleName, lastName) => {
        return `${title} ${firstName[0]}. ${middleName[0]}. ${processHyphenatedLastName(lastName)}`;
      }
    );

    // Wzorzec dla samych nazwisk po tytule: mgr Nazwisko lub mgr Nazwisko-Nazwisko2
    result = result.replace(
      /((?:mgr|dr|prof\.|dr hab\.|inż\.|arch\.)(?:\s+(?:mgr|dr|prof\.|dr hab\.|inż\.|arch\.))*)\s+([A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+(?:-[A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+)?)/g,
      (match, titles, lastName) => {
        const cleanTitles = titles.trim();
        if (lastName.match(/^[A-ZŻŹĆĄŚĘŁÓŃ][a-zżźćńółęąś]+$/)) {
          // Proste nazwisko
          return `${cleanTitles} ${lastName[0]}.`;
        }

        return `${cleanTitles} ${processHyphenatedLastName(lastName)}`;
      }
    );
    
    return result;
  } catch (error) {
    console.error('Error during HTML censoring:', error);
    return htmlContent;  // W przypadku błędu zwróć oryginalny tekst
  }
} 