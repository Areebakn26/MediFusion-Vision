import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

const staggerContainer = (reduce) => reduce ? {} : {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const staggerItem = (reduce) => reduce ? {} : {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const StaggerContainer = ({ children, className = '', reduce, ...props }) => {
  const reducedMotion = useReducedMotion();
  const shouldReduce = reduce ?? reducedMotion;

  return (
    <motion.div
      variants={staggerContainer(shouldReduce)}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const StaggerItem = ({ children, className = '', reduce, ...props }) => {
  const reducedMotion = useReducedMotion();
  const shouldReduce = reduce ?? reducedMotion;

  return (
    <motion.div
      variants={staggerItem(shouldReduce)}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

StaggerContainer.displayName = 'StaggerContainer';
StaggerItem.displayName = 'StaggerItem';

export { StaggerContainer, StaggerItem };