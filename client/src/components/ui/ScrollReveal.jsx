import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

const ScrollReveal = ({
  children,
  className = '',
  delay = 0,
  amount = 0.15,
  once = true,
  y = 40,
  ...props
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });
  const reduce = useReducedMotion();

  if (reduce) {
    return <div ref={ref} className={className} {...props}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

ScrollReveal.displayName = 'ScrollReveal';

export default ScrollReveal;