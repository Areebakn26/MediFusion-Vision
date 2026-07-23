export default function AnimatedLogo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-label="MediFusion Vision Logo"
      role="img"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 38 L22 38 L26 22 L30 44 L34 28 L38 38 L52 38" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}
