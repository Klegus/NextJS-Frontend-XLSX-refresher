import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  duration = 4000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Style toastu w zależności od typu
  const getStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 text-red-800 border-red-500';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-500';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-500';
      case 'success':
      default:
        return 'bg-green-50 text-green-800 border-green-500';
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  useEffect(() => {
    if (!isVisible) {
      const closeTimer = setTimeout(() => {
        onClose?.();
      }, 300); // Czas na zakończenie animacji
      return () => clearTimeout(closeTimer);
    }
  }, [isVisible, onClose]);

  return (
    <div 
      className={`${getStyles()} p-4 md:p-3 rounded-lg shadow-md border-l-4 min-w-[260px] md:min-w-[300px] max-w-[90vw] md:max-w-[400px]
                 transform transition-all duration-300 ease-out ${isVisible 
                 ? 'translate-x-0 opacity-100' 
                 : 'translate-y-2 opacity-0'}`}
    >
      <div className="text-base md:text-sm font-medium">{message}</div>
    </div>
  );
};

// Kontener dla toastów
interface ToastContainerProps {
  children: React.ReactNode;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => {
  return (
    <div className="fixed right-0 left-0 md:left-auto md:right-4 bottom-0 md:bottom-4 z-50 flex flex-col items-center md:items-end space-y-2 mx-auto">
      {children}
    </div>
  );
};

// Funkcja do wyświetlania toastów
interface ShowToastOptions extends ToastProps {}

export const showToast = (options: ShowToastOptions) => {
  // Sprawdź czy kontener istnieje, lub go utwórz
  let container = document.getElementById('toast-container');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed right-0 left-0 md:left-auto md:right-4 bottom-0 md:bottom-4 z-50 flex flex-col items-center md:items-end space-y-2 mx-auto';
    document.body.appendChild(container);
  }

  // Utwórz element dla toastu
  const toastElement = document.createElement('div');
  toastElement.className = 'w-full md:w-auto px-2 md:px-0';
  container.appendChild(toastElement);
  
  // Renderuj toast
  const root = createRoot(toastElement);
  
  root.render(
    <Toast 
      {...options} 
      onClose={() => {
        if (options.onClose) options.onClose();
        setTimeout(() => {
          if (container?.contains(toastElement)) {
            container.removeChild(toastElement);
          }
        }, 100);
      }} 
    />
  );
  
  // Automatycznie usuń toast po czasie
  if (options.duration !== Infinity) {
    setTimeout(() => {
      root.unmount();
      if (container?.contains(toastElement)) {
        container.removeChild(toastElement);
      }
    }, (options.duration || 4000) + 300); // Dodajemy czas na animację
  }
}; 