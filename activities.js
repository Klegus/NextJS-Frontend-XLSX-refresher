// Funkcje pomocnicze do obsługi przeczytanych aktywności
function getReadActivities() {
    const readActivities = localStorage.getItem('readActivities');
    return readActivities ? JSON.parse(readActivities) : {};
}

function markActivityAsRead(activityId) {
    const readActivities = getReadActivities();
    readActivities[activityId] = Date.now();
    localStorage.setItem('readActivities', JSON.stringify(readActivities));
}

function isActivityNew(activity) {
    const readActivities = getReadActivities();
    return !readActivities[activity.id]; // Zmiana z _id na id
}

// Funkcja formatująca względną datę
function formatRelativeDate(date) {
    const now = new Date();
    const activityDate = new Date(date);
    const diffTime = Math.abs(now - activityDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'dzisiaj';
    } else if (diffDays === 1) {
        return 'wczoraj';
    } else {
        return `${diffDays} dni temu`;
    }
}

async function fetchActivities() {
    const container = document.getElementById('activities-list');
    if (!container) {
        console.error('Nie znaleziono kontenera activities-list');
        return;
    }
    
    try {
        console.log('Rozpoczynam pobieranie aktywności...');
        const response = await axios.get('/api/activities?limit=10');
        const activities = response.data.activities;
        console.log('Pobrano aktywności:', activities);
        
        if (!Array.isArray(activities)) {
            console.error('Otrzymane dane nie są tablicą:', activities);
            displayError();
            return;
        }
        
        displayActivities(activities);
        console.log('Aktywności zostały wyświetlone');
    } catch (error) {
        console.error('Błąd podczas pobierania aktywności:', error);
        displayError();
    }
}

function displayActivities(activities) {
    const container = document.getElementById('activities-list');
    container.innerHTML = '';

    activities.forEach(activity => {
        const activityElement = createActivityElement(activity);
        container.appendChild(activityElement);
    });
}

function getContentHtml(activity) {
    // Jeśli content jest obiektem z html/text
    if (activity.content && typeof activity.content === 'object' && (activity.content.html || activity.content.text)) {
        return activity.content.html || activity.content.text;
    }
    
    // Jeśli mamy content_html lub content_text z API
    if (activity.content_html || activity.content_text) {
        return activity.content_html || activity.content_text;
    }
    
    // Jeśli content jest bezpośrednio stringiem
    if (activity.content && typeof activity.content === 'string') {
        return activity.content;
    }
    
    return '';
}

function createActivityElement(activity) {
    const div = document.createElement('div');
    const isNew = isActivityNew(activity);
    
    div.className = `activity-item p-4 border rounded-lg transition-colors ${
        isNew ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
    }`;
    
    div.setAttribute('data-activity-id', activity.id);

    const relativeDate = formatRelativeDate(activity.created_at);

    // Wspólny nagłówek dla wszystkich typów
    const headerHtml = `
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
                ${isNew ? '<span class="inline-block px-2 py-1 text-xs bg-green-500 text-white rounded-full new-badge">Nowe</span>' : ''}
                <h3 class="text-lg font-semibold text-gray-800">${activity.title}</h3>
            </div>
            <span class="text-sm text-gray-500">${relativeDate}</span>
        </div>
    `;

    // Obsługa różnych typów
    switch (activity.type) {
        case 'folder':
            // Specjalny widok dla folderu z ikoną
            div.innerHTML = `
                ${headerHtml}
                <div class="flex items-center gap-2 mt-2">
                    <svg class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                    </svg>
                    ${activity.url ? `
                        <a href="${activity.url}" target="_blank" 
                           class="text-blue-600 hover:text-blue-800 flex items-center">
                            Otwórz folder
                            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                        </a>
                    ` : ''}
                </div>
            `;
                break;
        case 'resource':
                    div.innerHTML = `
                        ${headerHtml}
                        <div class="mt-2">
                            <a href="${activity.url}" target="_blank" 
                               class="inline-flex items-center px-4 py-2 text-white rounded transition-colors"
                               style="background-color: var(--wspaa-red)">
                                Otwórz zasób
                                <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                                </svg>
                            </a>
                        </div>
                    `;
                    break;

        case 'page':
            // Rozwijana strona z zawartością i linkiem
            div.className += ' cursor-pointer hover:bg-gray-50';
            div.setAttribute('data-expanded', 'false');
            
            div.innerHTML = `
                ${headerHtml}
                <div class="content-section mt-2 hidden">
                    <div class="prose max-w-none">
                        ${activity.content || ''}
                        ${activity.images && activity.images.length > 0 ? `
                            <div class="images-section mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                ${activity.images.map(img => `
                                    <img src="${img.src}" alt="${img.alt}" class="max-w-full h-auto rounded shadow-sm"/>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="mt-2">
                Rozwiń lub 
                    <a href="${activity.url}" target="_blank" class="text-blue-600 hover:text-blue-800">
                        przejdż do zasobu →
                    </a>
                </div>
            `;

            // Dodanie obsługi rozwijania/zwijania
            div.addEventListener('click', handleExpandCollapse);
            break;

        case 'label':
            // Rozwijana etykieta tylko z zawartością
            div.className += ' cursor-pointer hover:bg-gray-50';
            div.setAttribute('data-expanded', 'false');
            
            div.innerHTML = `
                ${headerHtml}
                <div class="content-section mt-2 hidden">
                    <div class="prose max-w-none">
                        ${activity.content || ''}
                    </div>
                </div>
                <div class="mt-2">
                    
                        Rozwiń →
                    
                </div>
            `;

            // Dodanie obsługi rozwijania/zwijania
            div.addEventListener('click', handleExpandCollapse);
            break;
    }

    // Funkcja obsługująca rozwijanie/zwijanie
    function handleExpandCollapse(e) {
        if (e.target.tagName === 'A') return;

        if (isNew) {
            markActivityAsRead(activity.id);
            div.classList.remove('border-blue-400', 'bg-blue-50');
            div.classList.add('border-gray-200');
            const newBadge = div.querySelector('.new-badge');
            if (newBadge) newBadge.remove();
        }

        const contentSection = div.querySelector('.content-section');
        const isExpanded = div.getAttribute('data-expanded') === 'true';
        
        if (contentSection) {
            contentSection.classList.toggle('hidden');
            div.setAttribute('data-expanded', !isExpanded);
        }
    }

    // Oznaczanie jako przeczytane przy najechaniu dla wszystkich typów
    div.addEventListener('mouseenter', () => {
        if (isNew) {
            markActivityAsRead(activity.id);
            div.classList.remove('border-blue-400', 'bg-blue-50');
            div.classList.add('border-gray-200');
            const newBadge = div.querySelector('.new-badge');
            if (newBadge) newBadge.remove();
        }
    });

    return div;
}

function displayError() {
    const container = document.getElementById('activities-list');
    container.innerHTML = `
        <div class="text-center p-4 text-red-600">
            Wystąpił błąd podczas ładowania aktywności. Spróbuj odświeżyć stronę.
        </div>
    `;
}

// Pobierz aktywności przy załadowaniu strony
document.addEventListener('DOMContentLoaded', fetchActivities);

// Odświeżaj aktywności co 5 minut
setInterval(fetchActivities, 5 * 60 * 1000);
