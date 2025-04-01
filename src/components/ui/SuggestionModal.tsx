import { useState, useEffect } from 'react';
import { showToast } from '@/components/ui/toast';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuggestionModal: React.FC<SuggestionModalProps> = ({ isOpen, onClose }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const MAX_CHARS = 500;
  
  useEffect(() => {
    if (isOpen) {
      // Reset form state when modal is opened
      setContent('');
      setIsSubmitting(false);
      setCharacterCount(0);
      // Sprawdzanie pozostałej liczby sugestii, ale tylko dla wewnętrznej logiki
      checkRemainingCount();
    }
  }, [isOpen]);
  
  const checkRemainingCount = async () => {
    try {
      const response = await fetch('/api/suggestions/count');
      const data = await response.json();
      if (data.success) {
        setRemainingToday(data.remaining_today);
      }
    } catch (error) {
      console.error('Error checking remaining suggestions:', error);
      // W przypadku błędu pozwalamy na zgłoszenie, weryfikacja nastąpi po stronie serwera
      setRemainingToday(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      showToast({ message: 'Treść sugestii nie może być pusta', type: 'error' });
      return;
    }
    
    if (characterCount > MAX_CHARS) {
      showToast({ message: `Treść sugestii nie może przekraczać ${MAX_CHARS} znaków`, type: 'error' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast({ 
          message: `Sugestia została wysłana pomyślnie.`, 
          type: 'success' 
        });
        // Ciche aktualizowanie pozostałych sugestii
        if (data.remaining_today !== undefined) {
          setRemainingToday(data.remaining_today);
        }
        onClose();
      } else {
        // Obsługa typowych błędów
        if (response.status === 429) {
          showToast({ message: 'Przekroczono dzienny limit sugestii. Spróbuj ponownie jutro.', type: 'error' });
        } else {
          showToast({ message: data.message || 'Wystąpił błąd podczas wysyłania sugestii', type: 'error' });
        }
      }
    } catch (error) {
      console.error('Błąd podczas wysyłania sugestii:', error);
      showToast({ message: 'Nie udało się wysłać sugestii. Spróbuj ponownie później.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setCharacterCount(e.target.value.length);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-wspia-gray mb-4">Zgłoś sugestię</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="suggestion" className="block text-sm font-medium text-gray-700 mb-2">
                Treść sugestii lub zgłoszenia błędu
              </label>
              <textarea
                id="suggestion"
                className={`w-full p-3 border rounded-md ${characterCount > MAX_CHARS ? 'border-red-500' : 'border-gray-300'}`}
                rows={5}
                placeholder="Opisz swoje sugestie lub zgłoś błąd w planie zajęć..."
                value={content}
                onChange={handleContentChange}
                disabled={isSubmitting}
              />
              <div className={`text-xs mt-1 flex justify-end ${characterCount > MAX_CHARS ? 'text-red-500' : 'text-gray-500'}`}>
                {characterCount}/{MAX_CHARS}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-wspia-red text-gray-700 rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={isSubmitting || !content.trim() || characterCount > MAX_CHARS || remainingToday === 0}
              >
                {isSubmitting ? 'Wysyłanie...' : 'Wyślij sugestię'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 