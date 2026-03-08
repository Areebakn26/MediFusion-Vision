import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const GlassCard = ({
    children,
    className = '',
    hover = true,
    onClick,
    ...props
}) => {
    return (
        <motion.div
            className={clsx(
                'bg-white/70 backdrop-blur-md',
                'rounded-2xl shadow-glass',
                'border border-white/20',
                hover && 'hover:shadow-glow hover:-translate-y-1 cursor-pointer',
                'transition-all duration-300',
                className
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClick}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default GlassCard;
