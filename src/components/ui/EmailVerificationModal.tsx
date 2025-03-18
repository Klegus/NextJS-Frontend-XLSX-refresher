import React, { useState, useEffect } from 'react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (verified: boolean) => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerify
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // Check if we already have a saved email
      const savedEmail = localStorage.getItem('verified_email_address');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } else {
      setError('');
      setIsVerifying(false);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);
    
    // Validate email format
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Proszę podać prawidłowy adres email.');
      setIsVerifying(false);
      return;
    }
    
    // Check if it's a university email
    const domain = email.split('@')[1];
    if (domain === 'wspa.edu.pl') {
      // Success - verified university email
      localStorage.setItem('verified_email', 'true');
      localStorage.setItem('verified_email_address', email);
      onVerify(true);
      onClose();
    } else {
      setError('Wymagany jest email uczelniany.');
      setIsVerifying(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="Zamknij"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-xl font-bold mb-4 text-wspia-gray">Weryfikacja dostępu</h2>
        
        <p className="mb-4 text-gray-600">
          Aby wyłączyć cenzurę imion i nazwisk wykładowców, prosimy o weryfikację za pomocą emaila uczelnianego.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email uczelniany
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Wprowadź email uczelniany"
              required
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-wspia-red border border-wspia-red rounded-md hover:bg-wspia-red/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wspia-red"
              disabled={isVerifying}
            >
              {isVerifying ? 'Weryfikacja...' : 'Weryfikacja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 