async function updateInterfaceState() {
  const mainContainer = document.getElementById("main-container");
  const selectedPlan = await getSelectedPlan();
  const selectedGroup = await getSelectedGroup();
  const controlsContainer = document.getElementById("controls-container");
  const comparisonsSection = document.getElementById("comparisons-section");
  const activitiesSection = document.getElementById("activities-section");
  const planSection = document.getElementById("plan-container");

  if (selectedPlan && selectedGroup) {
    // Plan and group are selected
    mainContainer.classList.add("expanded");
    planSection.classList.remove("hidden");
    if (controlsContainer) controlsContainer.classList.remove("hidden");
    if (comparisonsSection) comparisonsSection.classList.remove("hidden");
    if (activitiesSection) activitiesSection.classList.remove("hidden");
    document.querySelectorAll(".select-wrapper").forEach((wrapper) => {
      wrapper.style.marginBottom = "1rem";
    });
  } else if (selectedPlan && !selectedGroup) {
    // Only plan is selected
    mainContainer.classList.remove("expanded");
    planSection.classList.add("hidden");
    if (controlsContainer) controlsContainer.classList.add("hidden");
    if (comparisonsSection) comparisonsSection.classList.add("hidden");
    if (activitiesSection) activitiesSection.classList.remove("hidden");
    document.querySelectorAll(".select-wrapper").forEach((wrapper) => {
      wrapper.style.marginBottom = "1.5rem";
    });
  } else {
    // Nothing is selected
    mainContainer.classList.remove("expanded");
    planSection.classList.add("hidden");
    if (controlsContainer) controlsContainer.classList.add("hidden");
    if (comparisonsSection) comparisonsSection.classList.add("hidden");
    if (activitiesSection) activitiesSection.classList.remove("hidden");
    document.querySelectorAll(".select-wrapper").forEach((wrapper) => {
      wrapper.style.marginBottom = "1.5rem";
    });
  }
}
function getWeekRange(date) {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(
    date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1)
  );
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return {
    start: startOfWeek,
    end: endOfWeek,
  };
}

function formatDate(date) {
  return date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function shouldShowNextWeek() {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  return (
    (currentDay === 5 &&
      (currentHour > 21 || (currentHour === 21 && currentMinutes >= 15))) ||
    currentDay === 6 ||
    currentDay === 0
  );
}

let currentWeekOffset = 0;

function getCurrentOrNextWeekRange() {
  let date = new Date();

  if (shouldShowNextWeek()) {
    // Znajdź następny poniedziałek
    while (date.getDay() !== 1) {
      date.setDate(date.getDate() + 1);
    }
    // Dodaj dodatkowy tydzień jeśli currentWeekOffset > 0
    if (currentWeekOffset > 0) {
      date.setDate(date.getDate() + 7);
    }
  } else {
    date.setDate(date.getDate() + 7 * currentWeekOffset);
  }

  return getWeekRange(date);
}

function moveToNextWeek() {
  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;

  if (isWeekend) {
    // W weekend pokazujemy następny tydzień jako "bieżący"
    if (currentWeekOffset < 1) {
      currentWeekOffset++;
      updateWeekButtons();
      const selectedGroup = groupSelect.value;
      if (selectedGroup) {
        loadPlanAndComparisons(planSelect.value, selectedGroup);
      }
    }
  } else {
    // Normalne zachowanie w dni robocze
    if (currentWeekOffset < 1) {
      currentWeekOffset++;
      updateWeekButtons();
      const selectedGroup = groupSelect.value;
      if (selectedGroup) {
        loadPlanAndComparisons(planSelect.value, selectedGroup);
      }
    }
  }
}

function moveToPrevWeek() {
  if (shouldShowNextWeek() && currentWeekOffset > 0) {
    // W weekend pozwól na cofnięcie do najbliższego tygodnia
    currentWeekOffset--;
    updateWeekButtons();
    const selectedGroup = groupSelect.value;
    if (selectedGroup) {
      loadPlanAndComparisons(planSelect.value, selectedGroup);
    }
  } else if (!shouldShowNextWeek() && currentWeekOffset > 0) {
    // Normalne zachowanie w dni robocze
    currentWeekOffset--;
    updateWeekButtons();
    const selectedGroup = groupSelect.value;
    if (selectedGroup) {
      loadPlanAndComparisons(planSelect.value, selectedGroup);
    }
  }
}

function updateWeekButtons() {
  const prevWeekBtn = document.getElementById("prevWeekBtn");
  const nextWeekBtn = document.getElementById("nextWeekBtn");

  if (shouldShowNextWeek()) {
    // W weekend:
    // - Zablokuj "poprzedni tydzień" tylko gdy jesteśmy w najbliższym tygodniu
    // - Pozwól na przejście jeden tydzień do przodu
    prevWeekBtn.disabled = currentWeekOffset === 0;
    nextWeekBtn.disabled = currentWeekOffset >= 1;
  } else {
    // Normalne zachowanie w dni robocze
    prevWeekBtn.disabled = currentWeekOffset === 0;
    nextWeekBtn.disabled = currentWeekOffset === 1;
  }
}

const colors = [
  "bg-blue-50 border-blue-200 text-blue-800",
  "bg-green-50 border-green-200 text-green-800",
  "bg-yellow-50 border-yellow-200 text-yellow-800",
  "bg-red-50 border-red-200 text-red-800",
  "bg-indigo-50 border-indigo-200 text-indigo-800",
  "bg-purple-50 border-purple-200 text-purple-800",
  "bg-pink-50 border-pink-200 text-pink-800",
];
function timeSinceUpdate(timestamp) {
  const now = new Date();
  const updateTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - updateTime) / 1000);

  const days = Math.floor(diffInSeconds / 86400);
  const hours = Math.floor((diffInSeconds % 86400) / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);

  let result = "";
  if (days > 0) result += `${days} ${days === 1 ? "dzień" : "dni"} `;
  if (hours > 0) result += `${hours} ${hours === 1 ? "godzina" : "godzin"} `;
  if (minutes > 0)
    result += `${minutes} ${minutes === 1 ? "minuta" : "minut"} `;
  if (result === "") result = "mniej niż minutę ";

  return result.trim() + " temu";
}

// Get DOM elements
const categorySelect = document.getElementById("category-select");


async function updateFacultySelect(selectedCategory) {
    let facultySelect = document.getElementById("faculty-select"); // Refresh reference
    facultySelect.disabled = !selectedCategory;
    facultySelect.innerHTML = '<option value="">Wybierz kierunek</option>';
    planSelect.disabled = true;
    planSelect.innerHTML = '<option value="">Najpierw wybierz kierunek</option>';
    groupSelect.disabled = true;
    groupSelect.innerHTML = '<option value="">Najpierw wybierz plan</option>';
    planContainer.classList.add('hidden');
    comparisonsContainer.innerHTML = '';

    if (selectedCategory) {
        try {
            const response = await axios.get(`/api/faculties/${selectedCategory}`);
            const faculties = response.data.faculties;

            // Sortowanie fakultetów alfabetycznie
            faculties.sort((a, b) => a.localeCompare(b, 'pl'));
            
            faculties.forEach(faculty => {
                const option = document.createElement('option');
                option.value = faculty;
                option.textContent = faculty;
                facultySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching faculties:', error);
            facultySelect.innerHTML = '<option value="">Błąd pobierania kierunków</option>';
        }
    }
}
async function updateGroupSelect(planElement) {
  groupSelect.disabled = !planElement;
  groupSelect.innerHTML = '<option value="">Wybierz grupę</option>';
  planContainer.classList.add("hidden");
  comparisonsContainer.innerHTML = "";

  if (planElement) {
    try {
      const groups = JSON.parse(planElement.dataset.groups);
      // Sortowanie grup z uwzględnieniem polskich znaków
      Object.keys(groups)
        .sort((a, b) => a.localeCompare(b, 'pl'))
        .forEach((group) => {
          const option = document.createElement("option");
          option.value = group;
          option.textContent = group;
          groupSelect.appendChild(option);
        });

      const lastSelectedGroup = loadSelectedGroup();
      if (lastSelectedGroup && Object.keys(groups).includes(lastSelectedGroup)) {
        groupSelect.value = lastSelectedGroup;
        await loadPlanAndComparisons(planElement.value, lastSelectedGroup);
      }
    } catch (error) {
      console.error("Error updating group select:", error);
    }
  }
}

categorySelect.addEventListener("change", async (event) => {
  const selectedCategory = event.target.value;
  saveSelectedCategory(selectedCategory);
  await updateFacultySelect(selectedCategory);
  facultySelect.value = "";
  planSelect.value = "";
  groupSelect.value = "";
  planContainer.classList.add("hidden");
  comparisonsContainer.innerHTML = "";
  updateControlsVisibility();
  updateInterfaceState();
});

facultySelect.addEventListener("change", async (event) => {
  const selectedCategory = categorySelect.value;
  const selectedFaculty = event.target.value;
  saveSelectedFaculty(selectedFaculty);
  await updatePlanSelect(selectedCategory, selectedFaculty);
  planSelect.value = "";
  groupSelect.value = "";
  planContainer.classList.add("hidden");
  comparisonsContainer.innerHTML = "";
  updateControlsVisibility();
  updateInterfaceState();
});

planSelect.addEventListener("change", (event) => {
  const selectedOption = event.target.selectedOptions[0];
  saveSelectedPlan(event.target.value);
  updateGroupSelect(selectedOption);
  groupSelect.value = "";
  planContainer.classList.add("hidden");
  comparisonsContainer.innerHTML = "";
  updateControlsVisibility();
  updateInterfaceState();
});

function startCountdown(endTime) {
  clearInterval(countdownInterval);
  const infoElement = document.getElementById("current-lesson-info");

  function updateCountdown() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const timeLeft = endTime - currentTime;

    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      highlightCurrentTimeSlot(); // Odśwież po zakończeniu odliczania
      return;
    }

    const minutes = Math.floor(timeLeft);
    const seconds = Math.floor((timeLeft - minutes) * 60);
    const countdownText = formatTimeToDisplay(minutes, seconds);

    // Aktualizuj tylko część z odliczaniem
    const currentContent = infoElement.innerHTML;
    const updatedContent = currentContent.replace(
      /Do końca przerwy: <span id="countdown">.*?<\/span>/,
      `Do końca przerwy: <span id="countdown">${countdownText}</span>`
    );
    infoElement.innerHTML = updatedContent;
  }

  updateCountdown(); // Natychmiastowa aktualizacja
  countdownInterval = setInterval(updateCountdown, 1000);
}
function convertTimeToMinutes(timeString) {
  // Usuwamy znaczniki HTML i dodatkowe spacje
  const cleanTimeString = timeString.replace(/<[^>]*>/g, "").trim();

  // Obsługa formatu bez dwukropka (np. "815")
  if (!cleanTimeString.includes(":")) {
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

  // Obsługa formatu z dwukropkiem (np. "8:15")
  const [hours, minutes] = cleanTimeString.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}
function formatMinutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

function formatCellContent(content, isTimeColumn) {
  if (isTimeColumn) {
    return formatTimeColumn(content);
  }
  const parts = content.split("-");
  if (parts.length > 1) {
    return `<span class="subject">${parts[0].trim()}</span>${parts
      .slice(1)
      .join("-")}`;
  }
  return content;
}
function formatTimeColumn(content) {
  const times = content.split("-");
  return times
    .map((time) => {
      const [hours, minutes] = time.trim().split(/(\d{2})$/);
      return `${hours}<sup>${minutes}</sup>`;
    })
    .join(" - ");
}

function formatTimeToDisplay(minutes, seconds) {
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function highlightCurrentTimeSlot() {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const selectedPlan = planSelect.value;
  const selectedGroup = groupSelect.value;
  if (!selectedPlan || !selectedGroup) return;

  axios.get(`/api/plan/${selectedPlan}/${selectedGroup}`).then((response) => {
    const category = response.data.category || "st";

    // Only highlight current time slot for 'st' category
    if (category !== "st") {
      const infoElement = document.getElementById("current-lesson-info");
      infoElement.innerHTML =
        "Podświetlanie aktualnej lekcji dostępne tylko dla studiów stacjonarnych";
      return;
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Dla planów stacjonarnych sprawdzamy weekend
    if (currentDay === 0 || currentDay === 6) {
      const infoElement = document.getElementById("current-lesson-info");
      infoElement.innerHTML = "Weekend! Czas wolny od zajęć 🎉";
      return;
    }
  });

  const table = document.querySelector("#plan-content table");
  if (!table) {
    console.log("Nie znaleziono tabeli z planem lekcji");
    return;
  }

  const rows = table.querySelectorAll("tr");
  const dayNames = [
    "Niedziela",
    "Poniedziałek",
    "Wtorek",
    "Środa",
    "Czwartek",
    "Piątek",
    "Sobota",
  ];
  let currentDayColumn = -1;

  const headerRow = rows[0];
  headerRow.querySelectorAll("th").forEach((th, index) => {
    if (th.textContent.trim().startsWith(dayNames[currentDay])) {
      currentDayColumn = index;
      console.log(
        `Znaleziono kolumnę dla ${dayNames[currentDay]}: ${currentDayColumn}`
      );
    }
  });

  if (currentDayColumn === -1) {
    console.log("Nie znaleziono kolumny dla aktualnego dnia tygodnia");
    return;
  }

  table.querySelectorAll(".current-time-highlight").forEach((cell) => {
    cell.classList.remove("current-time-highlight");
  });

  let currentLessonInfo = "";
  let nextLessonInfo = "";
  let isBreak = false;
  let breakEndTime = 0;

  if (currentDay === 0 || currentDay === 6) {
    currentLessonInfo = "Weekend! Czas na relaks i zabawę! 🎉";
  } else {
    for (let i = 1; i < rows.length; i++) {
      const timeCell = rows[i].querySelector("td:first-child");
      if (!timeCell) continue;

      const timeRange = timeCell.textContent.replace(/<[^>]*>/g, "").split("-");
      if (timeRange.length !== 2) continue;

      const startTime = convertTimeToMinutes(timeRange[0].trim());
      const endTime = convertTimeToMinutes(timeRange[1].trim());

      console.log(
        `Sprawdzanie przedziału: ${timeRange[0].trim()} - ${timeRange[1].trim()}`
      );
      console.log(`Przekonwertowany czas: ${startTime} - ${endTime}`);

      if (currentTime >= startTime && currentTime < endTime) {
        const cellToHighlight =
          rows[i].querySelectorAll("td")[currentDayColumn];
        if (cellToHighlight) {
          cellToHighlight.classList.add("current-time-highlight");
          console.log(
            `Podświetlono komórkę: rząd ${i}, kolumna ${currentDayColumn}`
          );
          const lessonContent = cellToHighlight.innerHTML.trim();
          const timeToEnd = endTime - currentTime;
          currentLessonInfo = lessonContent
            ? `Aktualna lekcja: ${lessonContent}<br>Koniec za: ${formatMinutesToTime(
                timeToEnd
              )}`
            : "Czas wolny!";

          // Check for next lesson
          if (i < rows.length - 1) {
            const nextCell =
              rows[i + 1].querySelectorAll("td")[currentDayColumn];
            if (nextCell) {
              console.log("Znaleziono komórkę następnej lekcji:", nextCell);
              const nextLessonContent = nextCell.innerHTML
                ? nextCell.innerHTML.trim()
                : "";
              console.log("Zawartość następnej lekcji:", nextLessonContent);

              const nextTimeCell = rows[i + 1].querySelector("td:first-child");
              console.log("Komórka czasu następnej lekcji:", nextTimeCell);

              if (nextTimeCell && nextTimeCell.textContent) {
                const nextStartTime = convertTimeToMinutes(
                  nextTimeCell.textContent
                    .replace(/<[^>]*>/g, "")
                    .split("-")[0]
                    .trim()
                );
                console.log(
                  "Czas rozpoczęcia następnej lekcji:",
                  nextStartTime
                );
                if (nextLessonContent) {
                  nextLessonInfo = `Następna lekcja: ${nextLessonContent}<br>Rozpoczyna się o: ${formatMinutesToTime(
                    nextStartTime
                  )}`;
                } else if (!lessonContent) {
                  nextLessonInfo = "Brak następnych lekcji";
                }
              } else {
                console.log("Brak danych o czasie następnej lekcji");
                if (nextLessonContent) {
                  nextLessonInfo = `Następna lekcja: ${nextLessonContent}`;
                } else if (!lessonContent) {
                  nextLessonInfo = "Brak następnych lekcji";
                }
              }
            } else {
              console.log("Nie znaleziono komórki następnej lekcji");
            }
          }
        } else {
          console.log(
            `Nie znaleziono komórki do podświetlenia: rząd ${i}, kolumna ${currentDayColumn}`
          );
        }
        break;
      } else if (
        i > 1 &&
        currentTime >=
          convertTimeToMinutes(
            rows[i - 1]
              .querySelector("td:first-child")
              .textContent.replace(/<[^>]*>/g, "")
              .split("-")[1]
              .trim()
          ) &&
        currentTime < startTime
      ) {
        isBreak = true;
        breakEndTime = startTime;
        const breakDuration = startTime - currentTime;
        currentLessonInfo = `Trwa przerwa!<br>Do końca przerwy: <span id="countdown">${formatTimeToDisplay(
          Math.floor(breakDuration),
          Math.floor((breakDuration % 1) * 60)
        )}</span>`;

        // Add next lesson info
        const nextCell = rows[i].querySelectorAll("td")[currentDayColumn];
        if (nextCell) {
          const nextLessonName =
            nextCell.querySelector(".subject")?.textContent.trim() ||
            nextCell.textContent.trim();
          nextLessonInfo = nextLessonName
            ? `Następna lekcja: ${nextLessonName}<br>Rozpoczyna się o: ${formatMinutesToTime(
                startTime
              )}`
            : "Brak następnych lekcji";
        }
        break;
      }
    }
    if (!currentLessonInfo) {
      currentLessonInfo = "Brak lekcji.";
    }
  }

  const infoElement = document.getElementById("current-lesson-info");
  infoElement.innerHTML = `${currentLessonInfo}<br>${nextLessonInfo}`;

  if (isBreak) {
    startCountdown(breakEndTime);
  } else {
    clearInterval(countdownInterval);
  }

  // Scroll only on initial page load
  if (!window.initialScrollDone && window.innerWidth <= 640) {
    const highlightedCell = table.querySelector(".current-time-highlight");
    if (highlightedCell) {
      highlightedCell.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
      window.initialScrollDone = true;
    }
  }
}

async function loadPlanAndComparisons(selectedPlan, selectedGroup) {
  if (selectedPlan && selectedGroup) {
    try {
      updateInterfaceState(); // Dodajemy wywołanie na początku
      const planResponse = await axios.get(
        `/api/plan/${encodeURIComponent(selectedPlan)}/${encodeURIComponent(selectedGroup)}`
      );
      const category = planResponse.data.category ;
      console.log("kategoria planu:", category);
      if (category === null) {
        // Get plan name from selected option
        const selectedOption = planSelect.selectedOptions[0];
        const planName = selectedOption ? selectedOption.textContent : '';
        groupNameElement.textContent = planName;
        
        // Set timestamp and update time since last update
        lastUpdateTimestamp = new Date(planResponse.data.timestamp);
        updateTimeSinceLastUpdate();
        
        // Clear week range for null category plans
        weekRangeElement.textContent = "";
        
        // Display the content directly from the plan_html for null category
        planContentElement.innerHTML = planResponse.data.plan_html;
        planContainer.classList.remove("hidden");
        
        // Hide controls for null category plans
        const controlsContainer = document.getElementById("controls-container");
        const comparisonsSection = document.getElementById("comparisons-section");
        if (controlsContainer) {
          controlsContainer.classList.add("hidden");
        }
        if (comparisonsSection) {
          comparisonsSection.classList.add("hidden");
        }
        
        // Add styling for download button if present
        const downloadBtn = planContentElement.querySelector('.download-btn');
        if (downloadBtn) {
          downloadBtn.classList.add(
            'inline-block',
            'px-4',
            'py-2',
            'text-white',
            'rounded',
            'hover:bg-blue-600',
            'transition-colors',
            'mt-4'
          );
          downloadBtn.style.backgroundColor = 'var(--wspaa-red)';
        }

        return;
      }
      // For non-standard plans, just display the plan without modifications
      if (category !== "st") {
        // Pobierz nazwę planu z wybranej opcji w select
        const selectedOption = planSelect.selectedOptions[0];
        const planName = selectedOption ? selectedOption.textContent : '';
        groupNameElement.textContent = planName;
        
        // Ustaw timestamp i zaktualizuj czas od ostatniej aktualizacji
        lastUpdateTimestamp = new Date(planResponse.data.timestamp);
        updateTimeSinceLastUpdate();
        
        // Ustaw zakres tygodnia
        if (category === "st") {
          const weekRange = getCurrentOrNextWeekRange();
          weekRangeElement.textContent = `Tydzień: ${formatDate(weekRange.start)} - ${formatDate(weekRange.end)}`;
        } else {
          weekRangeElement.textContent = "";
        }
        
        planContentElement.innerHTML = planResponse.data.plan_html;
        planContainer.classList.remove("hidden");
        return;
      }

      if (!planResponse.data.plan_html) {
        throw new Error("Otrzymano pusty plan HTML");
      }

      // Sprawdź czy plan_html jest stringiem i czy nie jest pusty
      if (typeof planResponse.data.plan_html !== "string") {
        console.error(
          "plan_html nie jest stringiem:",
          planResponse.data.plan_html
        );
        throw new Error("Nieprawidłowy format danych planu");
      }

      // Sprawdź czy plan zawiera tabelę
      if (!planResponse.data.plan_html.includes("<table")) {
        console.error(
          "plan_html nie zawiera tabeli:",
          planResponse.data.plan_html
        );
        throw new Error("Otrzymany plan nie zawiera tabeli");
      }
      try {
        const { plan_html, timestamp } = planResponse.data;

        console.log("Parsowanie danych odpowiedzi:");
        console.log("- timestamp:", timestamp);
        console.log("- plan_html długość:", plan_html ? plan_html.length : 0);

        if (!timestamp || !plan_html) {
          throw new Error("Brak wymaganych danych w odpowiedzi");
        }

        // Pobierz nazwę planu z wybranej opcji w select
        const selectedOption = planSelect.selectedOptions[0];
        const planName = selectedOption ? selectedOption.textContent : '';
        groupNameElement.textContent = planName;
        lastUpdateTimestamp = new Date(timestamp);
        updateTimeSinceLastUpdate();
      } catch (parseError) {
        console.error("Błąd podczas parsowania danych odpowiedzi:", parseError);
        throw parseError;
      }

      const weekRange = getCurrentOrNextWeekRange();
      weekRangeElement.textContent = `Tydzień: ${formatDate(
        weekRange.start
      )} - ${formatDate(weekRange.end)}`;

      let table;
      try {
        planContentElement.innerHTML = planResponse.data.plan_html;
        table = planContentElement.querySelector("table");
        if (!table) {
          throw new Error("Nie można znaleźć tabeli w planie");
        }

        if (filterToggle.checked && category === "st") {
          filterPlanForCurrentWeek(table, weekRange, planResponse.data);
        }
      } catch (renderError) {
        console.error("Błąd podczas renderowania tabeli:", renderError);
        throw renderError;
      }

      if (table) {
        table.classList.add(
          "w-full",
          "border-collapse",
          "border",
          "border-gray-200"
        );
        const rows = table.querySelectorAll("tr");
        rows.forEach((row, rowIndex) => {
          const cells = row.querySelectorAll("th, td");
          cells.forEach((cell, cellIndex) => {
            cell.classList.add("border", "border-gray-200", "p-2", "text-sm");
            if (cell.tagName === "TD") {
              const isTimeColumn = cellIndex === 0;
              console.log(
                "Formatowanie komórki:",
                cell.textContent,
                isTimeColumn
              );
              cell.innerHTML = formatCellContent(
                cell.textContent,
                isTimeColumn,
                category
              );
            }
          });
        });
      }

      planContainer.classList.remove("hidden");

      console.log("Plan lekcji załadowany, rozpoczęcie podświetlania");
      highlightCurrentTimeSlot();
      setInterval(highlightCurrentTimeSlot, 60000); // Update every minute

      const comparisonsResponse = await axios.get(
        `/api/comparisons/${encodeURIComponent(selectedPlan)}/${encodeURIComponent(selectedGroup)}`
      );
      const comparisons = comparisonsResponse.data;
      console.log("Otrzymane porównania:", comparisons);

      comparisonsContainer.innerHTML = comparisons
        .filter((comparison) => {
          console.log("Sprawdzanie porównania:", comparison);
          console.log("Wyniki dla grupy:", comparison.results?.[selectedGroup]);
          return comparison.results?.[selectedGroup]?.trim() !== "Brak różnic.";
        })
        .map(
          (comparison, index) => `
                    <div class="comparison-card ${
                      colors[index % colors.length]
                    } p-6 rounded-lg shadow-md border-l-4">
                        <h3 class="text-xl font-semibold mb-3">Porównanie z ${new Date(
                          comparison.timestamp
                        ).toLocaleString()}</h3>
                        <p class="mb-1"><strong>Nowszy plan:</strong> ${new Date(
                          comparison.newer_plan_timestamp
                        ).toLocaleString()}</p>
                        <p class="mb-1"><strong>Starszy plan:</strong> ${new Date(
                          comparison.older_plan_timestamp
                        ).toLocaleString()}</p>
                        <div class="mt-3">
                            <h4 class="font-semibold mb-2">Zmiany:</h4>
                            <p>${comparison.results[selectedGroup]}</p>
                        </div>
                    </div>
                `
        )
        .join("");

      if (comparisonsContainer.innerHTML === "") {
        comparisonsContainer.innerHTML =
          '<p class="text-xl text-center text-gray-600">Brak zmian w ostatnich porównaniach.</p>';
      }
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
      console.error("Szczegóły błędu:", error.response?.data || error.message);
      console.error("Stack trace:", error.stack);
      console.error("Pełny obiekt błędu:", JSON.stringify(error, null, 2));
      planContainer.classList.add("hidden");

      let errorMessage = "Wystąpił błąd podczas pobierania danych.";
      if (error.response?.data?.detail?.message) {
        errorMessage = `${error.response.data.detail.message}<br>`;
        if (error.response.data.detail.available_groups) {
          errorMessage += "<br>Dostępne grupy:<br>";
          error.response.data.detail.available_groups.forEach((group) => {
            errorMessage += `- ${group}<br>`;
          });
        }
      } else {
        errorMessage += `<br>Szczegóły błędu: ${error.message}`;
      }

      comparisonsContainer.innerHTML = `
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p class="text-xl mb-2">Błąd</p>
          <p>${errorMessage}</p>
        </div>`;
    }
  } else {
    planContainer.classList.add("hidden");
    comparisonsContainer.innerHTML = "";
  }
}
let lastUpdateTimestamp;

function updateTimeSinceLastUpdate() {
  if (lastUpdateTimestamp) {
    const timeSince = timeSinceUpdate(lastUpdateTimestamp);
    const adjustedTimestamp = new Date(lastUpdateTimestamp.getTime());
    const timeStr = adjustedTimestamp.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    planDateElement.textContent = `Data ostatniej zmiany planu: ${timeStr} (${timeSince.replace(/\d+ godzin(a|y)? /, '')})`; 
  }
}

function filterPlanForCurrentWeek(table, weekRange, planData) {
  if (!table) return;

  const rows = table.querySelectorAll("tr");
  const headerRow = rows[0];
  const headerCells = headerRow.querySelectorAll("th");

  // Określ dni tygodnia na podstawie kategorii planu
  const category = planData.category || "st";
  let daysConfig;
  switch (category) {
    case "nst":
      daysConfig = {
        startDay: 5, // Sobota
        numberOfDays: 2, // Sobota, Niedziela
        dayNames: ["Godziny", "Sobota", "Niedziela"],
      };
      break;
    case "nst_puw":
      daysConfig = {
        startDay: 5, // Sobota
        numberOfDays: 2, // Sobota, Niedziela
        dayNames: ["Godziny", "Sobota", "Niedziela"],
      };
      break;
    default: // 'st'
      daysConfig = {
        startDay: 0, // Poniedziałek
        numberOfDays: 5, // Poniedziałek-Piątek
        dayNames: [
          "Godziny",
          "Poniedziałek",
          "Wtorek",
          "Środa",
          "Czwartek",
          "Piątek",
        ],
      };
  }

  // Aktualizuj nagłówki z datami
  headerCells.forEach((cell, index) => {
    if (index > 0 && index <= daysConfig.numberOfDays) {
      const dayOfWeek = daysConfig.startDay + (index - 1);
      const date = new Date(weekRange.start);
      date.setDate(weekRange.start.getDate() + dayOfWeek);
      const originalText = cell.textContent.split("(")[0].trim();
      cell.textContent = `${originalText} (${formatDate(date).slice(0, 5)})`;
    }
  });

  // Filtruj wiersze z lekcjami
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll("td");
    let hasLessonsInWeek = false;

    cells.forEach((cell, cellIndex) => {
      if (cellIndex === 0) return; // Pomijamy kolumnę z godzinami

      if (cellIndex > daysConfig.numberOfDays) {
        cell.style.display = "none";
        return;
      }

      const cellContent = cell.innerHTML;
      if (cellContent && cellContent.trim() !== "") {
        const dayOfWeek = daysConfig.startDay + (cellIndex - 1);
        const currentDate = new Date(weekRange.start);
        currentDate.setDate(weekRange.start.getDate() + dayOfWeek);
        const dateStr = formatDate(currentDate).slice(0, 5);

        if (!cellContent.includes(dateStr)) {
          cell.innerHTML = "";
        } else {
          hasLessonsInWeek = true;
        }
      }
    });

    row.style.display = hasLessonsInWeek ? "" : "none";
  }
}

function saveSelectedCategory(category) {
  localStorage.setItem('selectedCategory', category);
}

function loadSelectedCategory() {
  return localStorage.getItem('selectedCategory');
}

function saveSelectedFaculty(faculty) {
  localStorage.setItem('selectedFaculty', faculty);
}

function loadSelectedFaculty() {
  return localStorage.getItem('selectedFaculty');
}

function saveSelectedPlan(plan) {
  localStorage.setItem('selectedPlan', plan);
}

function loadSelectedPlan() {
  return localStorage.getItem('selectedPlan');
}

function saveSelectedGroup(group) {
  localStorage.setItem('selectedGroup', group);
}

function loadSelectedGroup() {
  return localStorage.getItem('selectedGroup');
}

function toggleFilterPlan() {
  const isChecked = filterToggle.checked;
  localStorage.setItem("filterToggle", isChecked);
  const selectedPlan = planSelect.value;
  const selectedGroup = groupSelect.value;
  if (selectedPlan && selectedGroup) {
    loadPlanAndComparisons(selectedPlan, selectedGroup);
  }
}
function updateControlsVisibility() {
  const selectedPlan = planSelect.value;
  const selectedGroup = groupSelect.value;
  const controlsContainer = document.getElementById("controls-container");
  const comparisonsSection = document.getElementById("comparisons-section");

  if (selectedPlan && selectedGroup) {
    // Sprawdź kategorię planu
    axios.get(`/api/plan/${encodeURIComponent(selectedPlan)}/${encodeURIComponent(selectedGroup)}`).then((response) => {
      const category = response.data.category || "st";
      if (category === "st") {
        controlsContainer.classList.remove("hidden");
      } else {
        controlsContainer.classList.add("hidden");
        // format cells content
        actualplan = document.querySelector("#plan-content table");

        const rows = actualplan.querySelectorAll("tr");
        rows.forEach((row, rowIndex) => {
          const cells = row.querySelectorAll("th, td");
          cells.forEach((cell, cellIndex) => {
            cell.classList.add("border", "border-gray-200", "p-2", "text-sm");
            if (cell.tagName === "TD") {
              const isTimeColumn = cellIndex === 0;
              cell.innerHTML = formatCellContent(
                cell.textContent,
                isTimeColumn,
                category
              );
            }
          });
        });
      }

      const showComparerElement = document.getElementById('main-container');
      const showComparer = showComparerElement?.dataset?.showComparer === 'true';
      comparisonsSection.style.display = showComparer ? "" : "none";
    });
  } else {
    controlsContainer.classList.add("hidden");
    comparisonsSection.classList.add("hidden");
  }
}
window.addEventListener("DOMContentLoaded", async () => {
  // Pobierz aktywności na starcie
  fetchActivities();
  
  // Załaduj zapisane wartości
  const lastSelectedCategory = loadSelectedCategory();
  const lastSelectedFaculty = loadSelectedFaculty();
  const lastSelectedPlan = loadSelectedPlan();
  const lastSelectedGroup = loadSelectedGroup();

  if (lastSelectedCategory) {
    categorySelect.value = lastSelectedCategory;
    await updateFacultySelect(lastSelectedCategory);
    
    if (lastSelectedFaculty) {
      facultySelect.value = lastSelectedFaculty;
      await updatePlanSelect(lastSelectedCategory, lastSelectedFaculty);
      
      if (lastSelectedPlan) {
        planSelect.value = lastSelectedPlan;
        const selectedOption = planSelect.selectedOptions[0];
        await updateGroupSelect(selectedOption);
        
        if (lastSelectedGroup) {
          groupSelect.value = lastSelectedGroup;
          await loadPlanAndComparisons(lastSelectedPlan, lastSelectedGroup);
        }
      }
    }
  }

  // Inicjalizacja pozostałych elementów
  const filterToggleState = localStorage.getItem("filterToggle");
  if (filterToggleState !== null) {
    filterToggle.checked = filterToggleState === "true";
  }

  setInterval(updateTimeSinceLastUpdate, 60000);
  checkServerStatus();

  // Dodaj nasłuchiwanie zdarzeń dla przełącznika filtrowania
  filterToggle.addEventListener("change", toggleFilterPlan);

  // Dodaj obsługę przycisków "Poprzedni tydzień" i "Następny tydzień"
  document
    .getElementById("prevWeekBtn")
    .addEventListener("click", moveToPrevWeek);
  document
    .getElementById("nextWeekBtn")
    .addEventListener("click", moveToNextWeek);

  // Inicjalizacja stanu przycisków
  updateWeekButtons();
  updateControlsVisibility();
  updateInterfaceState();
});
let lastUpdateTime = null;
let failedAttempts = 0;
let lastFailTime = null;

async function checkServerStatus() {
  const indicator = document.getElementById("serverStatusIndicator");
  const statusText = document.getElementById("serverStatusText");
  const tooltip = document.getElementById("serverStatusTooltip");

  try {
    const response = await axios.get("/api/status");
    
    // Sprawdź czy system jest w trybie konserwacji
    if (response.data.maintenance_mode === true) {
      window.location.href = "/maintenance";
      return;
    }
    
    if (response.data.status === "active") {
      indicator.classList.add("active");
      indicator.classList.remove("inactive");
      statusText.textContent = "Online";
      statusText.style.color = "#10B981";
      failedAttempts = 0; // Reset licznika błędów
      lastFailTime = null;
    } else {
      indicator.classList.remove("active");
      indicator.classList.add("inactive");
      statusText.textContent = "Offline";
      statusText.style.color = "#EF4444";
    }
    lastUpdateTime = new Date(response.data.last_check);
    tooltip.textContent = `Ostatnia aktualizacja: ${lastUpdateTime.toLocaleString()}`;
  } catch (error) {
    console.error("Error checking server status:", error);
    
    // Sprawdź czy błąd to kod 503 (maintenance mode)
    if (error.response && error.response.status === 503) {
      window.location.href = "/maintenance";
      return;
    }
    
    const now = new Date();
    if (!lastFailTime) {
      lastFailTime = now;
    }
    
    failedAttempts++;
    
    // Sprawdź czy minęło więcej niż 10 sekund od pierwszego błędu
    const timeSinceFirstFail = (now - lastFailTime) / 1000;
    
    if (failedAttempts >= 3 && timeSinceFirstFail <= 10) {
      indicator.classList.remove("active");
      indicator.classList.add("inactive");
      statusText.textContent = "Błąd połączenia";
      statusText.style.color = "#EF4444";
      tooltip.textContent = "Nie można połączyć się z serwerem";
    } else if (timeSinceFirstFail > 10) {
      // Reset licznika po 10 sekundach
      failedAttempts = 1;
      lastFailTime = now;
    }
  }
}
groupSelect.addEventListener("change", async (event) => {
  const selectedPlan = planSelect.value;
  const selectedGroup = event.target.value;
  saveSelectedGroup(selectedGroup);
  await loadPlanAndComparisons(selectedPlan, selectedGroup);
  updateControlsVisibility();
  updateInterfaceState();
});
// Check server status every second
setInterval(checkServerStatus, 10000);
// Initial check when the page loads
window.addEventListener("DOMContentLoaded", async () => {
  const lastSelectedGroup = loadSelectedGroup();
  if (lastSelectedGroup) {
    groupSelect.value = lastSelectedGroup;
    await loadPlanAndComparisons(lastSelectedGroup);
  }
  checkServerStatus();
});
async function getSelectedPlan() {
  return planSelect.value;
}

async function getSelectedGroup() {
  return groupSelect.value;
}
