'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n';

/** Floating "back to top" button, shown once the page is scrolled down (long plans on phones). */
export const ScrollToTop: React.FC = () => {
    const { t } = useLanguage();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 600);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    if (!visible) return null;
    return (
        <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label={t('common.scrollTop')}
            title={t('common.scrollTop')}
            className="fixed bottom-5 right-4 z-40 w-11 h-11 rounded-full bg-white/95 border border-gray-200 shadow-md
                       text-wspia-gray flex items-center justify-center hover:bg-gray-50 active:scale-95 transition
                       print:hidden"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
        </button>
    );
};
