self.addEventListener('push', function(event) {
    const data = event.data.json();
    
    const options = {
        body: data.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: {
            url: data.url
        },
        vibrate: [200, 100, 200],
        tag: 'plan-update',
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification('Plan zajęć WSPiA', options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    if (event.notification.data.url) {
        event.waitUntil(
            clients.matchAll({type: 'window'}).then(function(clientList) {
                for (let client of clientList) {
                    if (client.url === event.notification.data.url && 'focus' in client) {
                        return client.focus();
                    }
                }
                return clients.openWindow(event.notification.data.url);
            })
        );
    }
});
