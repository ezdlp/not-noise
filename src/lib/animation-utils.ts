
import { cn } from '@/lib/utils';

/**
 * Standardized animation utility functions
 * Using predefined duration values to avoid Tailwind class ambiguity warnings
 */

export const fadeInAnimation = (delay?: 'short' | 'medium' | 'long') => {
  return cn(
    'opacity-0 animate-in fade-in duration-500',
    delay === 'short' && 'delay-150',
    delay === 'medium' && 'delay-300',
    delay === 'long' && 'delay-500'
  );
};

export const slideInAnimation = (
  direction: 'left' | 'right' | 'up' | 'down' = 'up',
  delay?: 'short' | 'medium' | 'long'
) => {
  return cn(
    'opacity-0 animate-in fade-in duration-500',
    direction === 'left' && 'slide-in-from-left-5',
    direction === 'right' && 'slide-in-from-right-5',
    direction === 'up' && 'slide-in-from-bottom-5',
    direction === 'down' && 'slide-in-from-top-5',
    delay === 'short' && 'delay-150',
    delay === 'medium' && 'delay-300',
    delay === 'long' && 'delay-500'
  );
};

export const pulseAnimation = () => {
  return 'animate-pulse duration-2000';
};
