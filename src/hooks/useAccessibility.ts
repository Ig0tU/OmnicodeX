import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store';

interface AccessibilityOptions {
  announceChanges?: boolean;
  manageFocus?: boolean;
  trapFocus?: boolean;
  enableKeyboardNavigation?: boolean;
}

interface FocusTrapOptions {
  autoFocus?: boolean;
  restoreFocus?: boolean;
  allowOutsideClick?: boolean;
}

export const useAccessibility = (options: AccessibilityOptions = {}) => {
  const {
    announceChanges = true,
    manageFocus = true,
    trapFocus = false,
    enableKeyboardNavigation = true,
  } = options;

  const accessibility = useAppStore(state => state.ui.accessibility);
  const [announcer, setAnnouncer] = useState<HTMLElement | null>(null);
  const focusHistoryRef = useRef<HTMLElement[]>([]);

  // Initialize accessibility utilities
  useEffect(() => {
    if (announceChanges && accessibility.announceStatus) {
      const announcerElement = createAnnouncer();
      setAnnouncer(announcerElement);
      document.body.appendChild(announcerElement);

      return () => {
        if (announcerElement && announcerElement.parentNode) {
          announcerElement.parentNode.removeChild(announcerElement);
        }
      };
    }
  }, [announceChanges, accessibility.announceStatus]);

  const createAnnouncer = (): HTMLElement => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    return announcer;
  };

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcer && accessibility.announceStatus) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;
      
      // Clear after announcement to avoid repeated announcements
      setTimeout(() => {
        if (announcer) {
          announcer.textContent = '';
        }
      }, 1000);
    }
  }, [announcer, accessibility.announceStatus]);

  const manageFocusHistory = useCallback((element: HTMLElement) => {
    if (manageFocus) {
      focusHistoryRef.current.push(element);
    }
  }, [manageFocus]);

  const restoreFocus = useCallback(() => {
    if (manageFocus && focusHistoryRef.current.length > 0) {
      const previousElement = focusHistoryRef.current.pop();
      if (previousElement && document.contains(previousElement)) {
        previousElement.focus();
      }
    }
  }, [manageFocus]);

  const focusFirst = useCallback((container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, []);

  const focusLast = useCallback((container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, []);

  return {
    announce,
    manageFocusHistory,
    restoreFocus,
    focusFirst,
    focusLast,
    accessibility,
  };
};

export const useFocusTrap = (isActive: boolean, options: FocusTrapOptions = {}) => {
  const {
    autoFocus = true,
    restoreFocus = true,
    allowOutsideClick = false,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    if (autoFocus) {
      const firstFocusable = getFocusableElements(container)[0];
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        trapTabKey(event, container);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (!allowOutsideClick && !container.contains(event.target as Node)) {
        event.preventDefault();
        event.stopPropagation();
        
        // Return focus to the first focusable element
        const firstFocusable = getFocusableElements(container)[0];
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    if (!allowOutsideClick) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (!allowOutsideClick) {
        document.removeEventListener('mousedown', handleClickOutside);
      }

      if (restoreFocus && previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isActive, autoFocus, restoreFocus, allowOutsideClick]);

  const trapTabKey = (event: KeyboardEvent, container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable?.focus();
    } else if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable?.focus();
    }
  };

  return { containerRef };
};

export const useKeyboardNavigation = (
  container: React.RefObject<HTMLElement>,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
    activateOnFocus?: boolean;
  } = {}
) => {
  const {
    orientation = 'both',
    loop = true,
    activateOnFocus = false,
  } = options;

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [items, setItems] = useState<HTMLElement[]>([]);

  useEffect(() => {
    if (!container.current) return;

    const containerElement = container.current;
    const focusableItems = getFocusableElements(containerElement);
    setItems(focusableItems);

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event;
      let preventDefault = false;
      let newIndex = currentIndex;

      switch (key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            newIndex = getNextIndex(currentIndex, focusableItems.length, 1, loop);
            preventDefault = true;
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            newIndex = getNextIndex(currentIndex, focusableItems.length, -1, loop);
            preventDefault = true;
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            newIndex = getNextIndex(currentIndex, focusableItems.length, 1, loop);
            preventDefault = true;
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            newIndex = getNextIndex(currentIndex, focusableItems.length, -1, loop);
            preventDefault = true;
          }
          break;
        case 'Home':
          newIndex = 0;
          preventDefault = true;
          break;
        case 'End':
          newIndex = focusableItems.length - 1;
          preventDefault = true;
          break;
        case 'Enter':
        case ' ':
          if (activateOnFocus && currentIndex >= 0) {
            focusableItems[currentIndex]?.click();
            preventDefault = true;
          }
          break;
      }

      if (preventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (newIndex !== currentIndex && newIndex >= 0) {
        setCurrentIndex(newIndex);
        focusableItems[newIndex]?.focus();
      }
    };

    containerElement.addEventListener('keydown', handleKeyDown);
    
    return () => {
      containerElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [container, currentIndex, orientation, loop, activateOnFocus, items]);

  const focusItem = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentIndex(index);
      items[index]?.focus();
    }
  }, [items]);

  return {
    currentIndex,
    focusItem,
    items,
  };
};

export const useSkipLinks = () => {
  const [skipLinks, setSkipLinks] = useState<Array<{ href: string; text: string }>>([]);

  const registerSkipLink = useCallback((href: string, text: string) => {
    setSkipLinks(prev => {
      if (prev.some(link => link.href === href)) {
        return prev;
      }
      return [...prev, { href, text }];
    });
  }, []);

  const unregisterSkipLink = useCallback((href: string) => {
    setSkipLinks(prev => prev.filter(link => link.href !== href));
  }, []);

  const renderSkipLinks = useCallback(() => {
    return skipLinks.map(({ href, text }) => (
      <a
        key={href}
        href={href}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {text}
      </a>
    ));
  }, [skipLinks]);

  return {
    registerSkipLink,
    unregisterSkipLink,
    renderSkipLinks,
  };
};

export const useAriaDescribedBy = () => {
  const [descriptions, setDescriptions] = useState<Map<string, string>>(new Map());

  const addDescription = useCallback((id: string, description: string) => {
    setDescriptions(prev => new Map(prev.set(id, description)));
  }, []);

  const removeDescription = useCallback((id: string) => {
    setDescriptions(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const getDescriptionIds = useCallback((ids: string[]) => {
    return ids.filter(id => descriptions.has(id)).join(' ') || undefined;
  }, [descriptions]);

  const renderDescriptions = useCallback(() => {
    return Array.from(descriptions.entries()).map(([id, description]) => (
      <div key={id} id={id} className="sr-only">
        {description}
      </div>
    ));
  }, [descriptions]);

  return {
    addDescription,
    removeDescription,
    getDescriptionIds,
    renderDescriptions,
  };
};

// Utility functions
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    'audio[controls]',
    'video[controls]',
    'details > summary',
  ].join(', ');

  const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  
  return elements.filter(element => {
    return (
      element.offsetWidth > 0 ||
      element.offsetHeight > 0 ||
      element.getClientRects().length > 0
    );
  });
};

const getNextIndex = (
  currentIndex: number,
  length: number,
  direction: number,
  loop: boolean
): number => {
  let newIndex = currentIndex + direction;

  if (newIndex >= length) {
    newIndex = loop ? 0 : length - 1;
  } else if (newIndex < 0) {
    newIndex = loop ? length - 1 : 0;
  }

  return newIndex;
};

export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const { r, g, b } = rgb;
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const rLum = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLum = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLum = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * rLum + 0.7152 * gLum + 0.0722 * bLum;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const isHighContrastMode = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

export const isReducedMotionPreferred = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const isColorSchemePreferred = (): 'light' | 'dark' | 'no-preference' => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'no-preference';
};