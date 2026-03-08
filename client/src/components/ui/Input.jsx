import { clsx } from 'clsx';

const Input = ({
    label,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium mb-2 text-gray-700">
                    {label}
                </label>
            )}
            <input
                className={clsx(
                    'w-full px-4 py-3 rounded-xl',
                    'bg-white/50 backdrop-blur-sm',
                    'border border-white/20',
                    'focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20',
                    'outline-none transition-all duration-200',
                    'placeholder:text-gray-400',
                    error && 'border-red-300 focus:border-red-500 focus:ring-red-200',
                    className
                )}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

export default Input;
