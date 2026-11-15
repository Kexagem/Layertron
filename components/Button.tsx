
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  isLoading = false,
  loadingText = "Loading...",
  ...props
}) => {
  const baseStyle = "btn rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-blue)] transition-colors duration-150";
  
  let variantStyle = "";
  switch (variant) {
    case 'primary':
      variantStyle = "bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white";
      break;
    case 'ghost':
      variantStyle = "bg-transparent hover:bg-gray-700 text-[var(--text-primary)]";
      break;
    case 'secondary':
    default:
      variantStyle = "bg-gray-600 hover:bg-gray-500 text-[var(--text-primary)]";
      break;
  }

  let sizeStyle = "";
  switch (size) {
    case 'sm':
      sizeStyle = "px-3 py-1 text-sm";
      break;
    case 'lg':
      sizeStyle = "px-6 py-3 text-lg";
      break;
    case 'md':
    default:
      sizeStyle = "px-4 py-2 text-sm";
      break;
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText}
        </div>
      ) : (
        children
      )}
    </button>
  );
};
