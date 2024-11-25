self.addEventListener('push', function(event) {
    const data = event.data.json();
    
    const options = {
        body: data.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: {
            url: data.url
        }
    };

    event.waitUntil(
        self.registration.showNotification('Plan zajęć WSPiA', options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    if (event.notification.data.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});
