import React from 'react';

interface StackzenLogoProps {
  className?: string;
}

const StackzenLogo: React.FC<StackzenLogoProps> = ({ className = '' }) => (
  <svg
    className={`h-12 w-12 text-primary dark:text-white md:h-16 md:w-16 ${className}`}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Stackzen Logo"
  >
    <circle cx="32" cy="32" r="32" fill="currentColor" />
    <path
      d="M32 16L44 32L32 48L20 32L32 16Z"
      fill="#FBBF24"
      stroke="#FFF"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="32" cy="32" r="6" fill="#FFF" />
  </svg>
);

export default StackzenLogo;
