import React from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useIntersectionObserver } from 'react-intersection-observer';
import type { BaseComponentProps } from '../../types';

interface AnimatedCardProps extends BaseComponentProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  hover?: boolean;
  stagger?: boolean;
  pulse?: boolean;
  glow?: boolean;
  borderGradient?: boolean;
}

const directionVariants = {
  up: { y: 50, opacity: 0 },
  down: { y: -50, opacity: 0 },
  left: { x: 50, opacity: 0 },
  right: { x: -50, opacity: 0 },
};

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  hover = true,
  stagger = false,
  pulse = false,
  glow = false,
  borderGradient = false,
  testId,
  ariaLabel,
  ariaDescribedBy,
}) => {
  const controls = useAnimation();
  const [ref, inView] = useIntersectionObserver({
    triggerOnce: true,
    threshold: 0.1,
  });

  React.useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const cardVariants = {
    hidden: {
      ...directionVariants[direction],
      scale: 0.95,
    },
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: stagger ? delay : 0,
        ease: [0.25, 0.46, 0.45, 0.94],
        when: "beforeChildren",
        staggerChildren: stagger ? 0.1 : 0,
      },
    },
  };

  const hoverVariants = {
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
      },
    },
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const glowVariants = {
    glow: {
      boxShadow: [
        "0 0 20px rgba(59, 130, 246, 0.3)",
        "0 0 40px rgba(59, 130, 246, 0.5)",
        "0 0 20px rgba(59, 130, 246, 0.3)",
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const baseClasses = [
    "relative",
    "rounded-lg",
    "backdrop-blur-sm",
    "border",
    "border-border/20",
    "transition-all",
    "duration-300",
    className,
  ].join(" ");

  const borderGradientClasses = borderGradient
    ? "before:absolute before:inset-0 before:p-[1px] before:rounded-lg before:bg-gradient-to-r before:from-primary/20 before:via-accent/20 before:to-primary/20 before:-z-10"
    : "";

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={controls}
      whileHover={hover ? "hover" : undefined}
      whileTap={hover ? "tap" : undefined}
      className={`${baseClasses} ${borderGradientClasses}`}
      data-testid={testId}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      {...(hover && hoverVariants)}
      {...(pulse && { animate: ["visible", "pulse"] })}
      {...(glow && { animate: ["visible", "glow"] })}
    >
      {borderGradient && (
        <div className="absolute inset-[1px] rounded-lg bg-card/80 backdrop-blur-sm" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

// Animated list container for staggered animations
export const AnimatedList: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className = '', staggerDelay = 0.1 }) => {
  const listVariants = {
    visible: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Animated item for use within AnimatedList
export const AnimatedListItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};