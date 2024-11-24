interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`
                relative inline-flex h-6 w-11 items-center rounded-full
                transition-colors duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-wspia-red/20 focus:ring-offset-2
                ${checked ? 'bg-[#e31e24]' : 'bg-gray-200'}
                border-2 border-gray-400 hover:border-gray-500
            `}
        >
            <span className="sr-only">{label}</span>
            <span
                className={`
                    inline-block h-4 w-4 transform rounded-full
                    transition-transform duration-200 ease-in-out
                    bg-white shadow-md border border-gray-300
                    ${checked ? 'translate-x-6' : 'translate-x-1'}
                `}
            />
        </button>
    );
};
