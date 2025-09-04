import React, { forwardRef } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccessibility } from '@/hooks/useAccessibility';
import type { InteractiveComponentProps } from '@/types';

interface AccessibleButtonProps extends InteractiveComponentProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  loadingText?: string;
  tooltip?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  animate?: boolean;
  haptic?: boolean;
}

const variantClasses = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary',
  ghost: 'hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent',
  link: 'text-primary underline-offset-4 hover:underline focus-visible:ring-primary',
};

const sizeClasses = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
};

export const AccessibleButton = forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps & Omit<MotionProps, 'children'>
>(({
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  disabled = false,
  loading = false,
  children,
  loadingText,
  tooltip,
  shortcut,
  icon,
  iconPosition = 'left',
  animate = true,
  haptic = false,
  onClick,
  onKeyDown,
  testId,
  ariaLabel,
  ariaDescribedBy,
  ...props
}, ref) => {
  const { announce, accessibility } = useAccessibility();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Haptic feedback on supported devices
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // Announce action for screen readers
    if (accessibility.announceStatus) {
      const actionText = loadingText || `Activating ${ariaLabel || 'button'}`;
      announce(actionText);
    }

    onClick?.(event);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Handle space and enter keys
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleClick(event as any);
    }

    onKeyDown?.(event);
  };

  const buttonContent = (
    <>
      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mr-2 flex items-center"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        </motion.div>
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <div className="mr-2 flex items-center" aria-hidden="true">
          {icon}
        </div>
      )}
      
      <span className={loading ? 'opacity-70' : ''}>
        {loading && loadingText ? loadingText : children}
      </span>
      
      {icon && iconPosition === 'right' && !loading && (
        <div className="ml-2 flex items-center" aria-hidden="true">
          {icon}
        </div>
      )}
      
      {shortcut && (
        <kbd 
          className="ml-2 inline-flex h-5 max-h-full items-center rounded border border-border px-1 font-mono text-xs font-medium text-muted-foreground opacity-100"
          aria-label={`Keyboard shortcut: ${shortcut}`}
        >
          {shortcut}
        </kbd>
      )}
    </>
  );

  const baseClasses = cn(
    // Base styles
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium',
    
    // Focus styles
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    
    // Disabled styles
    'disabled:pointer-events-none disabled:opacity-50',
    
    // Transition
    'transition-colors duration-200',
    
    // High contrast mode support
    'forced-colors:border forced-colors:border-solid',
    
    // Variant and size classes
    variantClasses[variant],
    sizeClasses[size],
    
    className
  );

  const MotionButton = motion.button;

  const animationProps = animate ? {
    whileHover: disabled || loading ? {} : { scale: 1.02 },
    whileTap: disabled || loading ? {} : { scale: 0.98 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  } : {};

  return (
    <MotionButton
      ref={ref}
      type={type}
      className={baseClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid={testId}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      title={tooltip}
      {...animationProps}
      {...props}
    >
      {buttonContent}
    </MotionButton>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

// Specialized button variants
export const PrimaryButton = forwardRef<
  HTMLButtonElement,
  Omit<AccessibleButtonProps, 'variant'>
>((props, ref) => (
  <AccessibleButton ref={ref} variant="default" {...props} />
));

export const SecondaryButton = forwardRef<
  HTMLButtonElement,
  Omit<AccessibleButtonProps, 'variant'>
>((props, ref) => (
  <AccessibleButton ref={ref} variant="secondary" {...props} />
));

export const DestructiveButton = forwardRef<
  HTMLButtonElement,
  Omit<AccessibleButtonProps, 'variant'>
>((props, ref) => (
  <AccessibleButton ref={ref} variant="destructive" {...props} />
));

export const OutlineButton = forwardRef<
  HTMLButtonElement,
  Omit<AccessibleButtonProps, 'variant'>
>((props, ref) => (
  <AccessibleButton ref={ref} variant="outline" {...props} />
));

export const GhostButton = forwardRef<
  HTMLButtonElement,
  Omit<AccessibleButtonProps, 'variant'>
>((props, ref) => (
  <AccessibleButton ref={ref} variant="ghost" {...props} />
));

export const IconButton = forwardRef<
  HTMLButtonElement,
  Omit<AccessibleButtonProps, 'size' | 'children'> & {
    icon: React.ReactNode;
    ariaLabel: string; // Required for icon-only buttons
  }
>(({ icon, ariaLabel, ...props }, ref) => (
  <AccessibleButton 
    ref={ref} 
    size="icon" 
    ariaLabel={ariaLabel}
    {...props}
  >
    {icon}
  </AccessibleButton>
));

// Button group component for managing focus
export const ButtonGroup: React.FC<{
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  ariaLabel?: string;
}> = ({ 
  children, 
  orientation = 'horizontal',
  className,
  ariaLabel 
}) => {
  const groupRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const buttons = Array.from(group.querySelectorAll('button:not([disabled])')) as HTMLButtonElement[];
      const currentIndex = buttons.findIndex(button => button === document.activeElement);
      
      if (currentIndex === -1) return;

      let newIndex = currentIndex;

      switch (event.key) {
        case 'ArrowRight':
          if (orientation === 'horizontal') {
            newIndex = (currentIndex + 1) % buttons.length;
            event.preventDefault();
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal') {
            newIndex = (currentIndex - 1 + buttons.length) % buttons.length;
            event.preventDefault();
          }
          break;
        case 'ArrowDown':
          if (orientation === 'vertical') {
            newIndex = (currentIndex + 1) % buttons.length;
            event.preventDefault();
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical') {
            newIndex = (currentIndex - 1 + buttons.length) % buttons.length;
            event.preventDefault();
          }
          break;
        case 'Home':
          newIndex = 0;
          event.preventDefault();
          break;
        case 'End':
          newIndex = buttons.length - 1;
          event.preventDefault();
          break;
      }

      if (newIndex !== currentIndex) {
        buttons[newIndex]?.focus();
      }
    };

    group.addEventListener('keydown', handleKeyDown);
    return () => group.removeEventListener('keydown', handleKeyDown);
  }, [orientation]);

  return (
    <div
      ref={groupRef}
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row space-x-1' : 'flex-col space-y-1',
        className
      )}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            tabIndex: index === 0 ? 0 : -1,
          } as any);
        }
        return child;
      })}
    </div>
  );
};