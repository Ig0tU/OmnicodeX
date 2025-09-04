import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Code, Zap, Database, Cloud, Shield } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'builder' | 'orbit' | 'wave';
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colorClasses = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  color = 'primary',
  text,
  fullScreen = false,
}) => {
  const renderSpinner = () => {
    const baseClasses = `${sizeClasses[size]} ${colorClasses[color]}`;

    switch (variant) {
      case 'default':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className={baseClasses}
          >
            <Loader2 className="w-full h-full" />
          </motion.div>
        );

      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full bg-current ${colorClasses[color]}`}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <motion.div
            className={`${baseClasses} rounded-full bg-current`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );

      case 'builder':
        const icons = [Code, Database, Cloud, Shield, Zap];
        return (
          <div className="relative w-16 h-16">
            {icons.map((Icon, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 flex items-center justify-center"
                animate={{
                  rotate: 360,
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                }}
                style={{
                  transformOrigin: 'center',
                }}
              >
                <Icon className={`w-4 h-4 ${colorClasses[color]}`} />
              </motion.div>
            ))}
          </div>
        );

      case 'orbit':
        return (
          <div className="relative w-16 h-16">
            <motion.div
              className="absolute inset-0 border-2 border-transparent border-t-current rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ borderTopColor: 'currentColor' }}
            />
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 rounded-full bg-current ${colorClasses[color]}`}
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 0.3,
                }}
                style={{
                  top: '50%',
                  left: '50%',
                  transformOrigin: `${10 + i * 5}px 0`,
                  marginTop: '-4px',
                  marginLeft: '-4px',
                }}
              />
            ))}
          </div>
        );

      case 'wave':
        return (
          <div className="flex items-end space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-1 bg-current ${colorClasses[color]}`}
                animate={{
                  height: ['10px', '30px', '10px'],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const content = (
    <div className="flex flex-col items-center space-y-4">
      {renderSpinner()}
      {text && (
        <motion.p
          className={`text-sm font-medium ${colorClasses[color]}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
      >
        {content}
      </motion.div>
    );
  }

  return content;
};

// Skeleton loader for content
export const SkeletonLoader: React.FC<{
  className?: string;
  lines?: number;
  avatar?: boolean;
  animated?: boolean;
}> = ({ className = '', lines = 3, avatar = false, animated = true }) => {
  const pulseAnimation = animated
    ? {
        opacity: [0.5, 1, 0.5],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }
    : {};

  return (
    <div className={`space-y-3 ${className}`}>
      {avatar && (
        <motion.div
          className="w-10 h-10 bg-muted rounded-full"
          animate={pulseAnimation}
        />
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-muted rounded"
          animate={pulseAnimation}
          style={{
            width: i === lines - 1 ? '75%' : '100%',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
};

// Progress loader with steps
export const StepLoader: React.FC<{
  steps: string[];
  currentStep: number;
  color?: LoadingSpinnerProps['color'];
}> = ({ steps, currentStep, color = 'primary' }) => {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <motion.div
          key={index}
          className="flex items-center space-x-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{
            opacity: index <= currentStep ? 1 : 0.5,
            x: 0,
          }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex-shrink-0">
            {index < currentStep ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`w-6 h-6 rounded-full bg-green-400 flex items-center justify-center`}
              >
                <motion.svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.div>
            ) : index === currentStep ? (
              <div className={`w-6 h-6 rounded-full border-2 border-current ${colorClasses[color]} flex items-center justify-center`}>
                <motion.div
                  className={`w-2 h-2 rounded-full bg-current`}
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-muted" />
            )}
          </div>
          <span
            className={`text-sm font-medium ${
              index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {step}
          </span>
        </motion.div>
      ))}
    </div>
  );
};