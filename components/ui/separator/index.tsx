import * as React from 'react';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className = '', orientation = 'horizontal', ...props }, ref) => {
    const ariaOrientation = orientation === 'horizontal' ? 'horizontal' : 'vertical';

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={ariaOrientation}
        className={`${
          orientation === 'horizontal' ? 'my-4 h-px w-full' : 'mx-4 h-full w-px'
        } bg-gray-200 dark:bg-gray-700 ${className}`}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';

export default Separator;
