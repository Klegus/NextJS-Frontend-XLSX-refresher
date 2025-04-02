'use client';

import { useEffect, useState } from 'react';

export const LoadingBar = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // This would normally use Next.js router events, but for demo purposes
    // we'll simulate loading with a timeout
    const handleStart = () => {
      setLoading(true);
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 90) {
            clearInterval(interval);
            return prevProgress;
          }
          return prevProgress + 10;
        });
      }, 100);
      
      // Simulate page load
      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          setLoading(false);
          setProgress(0);
        }, 200);
      }, 1000);
    };
    
    // Simulate a page load when the component mounts
    handleStart();
    
    // For a real implementation with Next.js router:
    // const router = useRouter();
    // router.events.on('routeChangeStart', handleStart);
    // router.events.on('routeChangeComplete', handleComplete);
    // router.events.on('routeChangeError', handleComplete);
    
    return () => {
      // Clean up any intervals/timeouts
      // In a real implementation: router.events.off(...)
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50">
      <div 
        className="h-full bg-wspia-red" 
        style={{ 
          width: `${progress}%`,
          transition: 'width 0.2s ease-in-out'
        }}
      />
    </div>
  );
}; 