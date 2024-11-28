interface StatusBarProps {
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    onClose?: () => void;
  }
  
  export const StatusBar: React.FC<StatusBarProps> = ({ message, type, onClose }) => {
    const getStatusStyles = () => {
      switch (type) {
        case 'info':
          return 'bg-blue-50 text-blue-800 border-blue-200';
        case 'warning':
          return 'bg-yellow-50 text-yellow-800 border-yellow-200';
        case 'error':
          return 'bg-red-50 text-red-800 border-red-200';
        case 'success':
          return 'bg-green-50 text-green-800 border-green-200';
        default:
          return 'bg-gray-50 text-gray-800 border-gray-200';
      }
    };
  
    return (
      <div className={`fixed bottom-0 left-0 right-0 p-4 border-t ${getStatusStyles()} 
                      transition-all duration-300 transform z-50`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {type === 'info' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {type === 'warning' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {type === 'error' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {type === 'success' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span>{message}</span>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  };