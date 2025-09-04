import React, { createContext, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  VolumeX, 
  Volume2, 
  Monitor, 
  Smartphone,
  Settings,
  Keyboard,
  MousePointer,
  Contrast,
  Type,
  Zap
} from 'lucide-react';
import { useAppStore } from '@/store';
import { AccessibleButton, ButtonGroup } from './AccessibleButton';
import { useAccessibility, isHighContrastMode, isReducedMotionPreferred, isColorSchemePreferred } from '@/hooks/useAccessibility';

interface AccessibilityContextType {
  isAccessibilityPanelOpen: boolean;
  toggleAccessibilityPanel: () => void;
  preferences: AccessibilityPreferences;
  updatePreferences: (updates: Partial<AccessibilityPreferences>) => void;
  announceToScreen: (message: string, priority?: 'polite' | 'assertive') => void;
}

interface AccessibilityPreferences {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  announceChanges: boolean;
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
  focusVisible: boolean;
  colorBlindFriendly: boolean;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAccessibilityPanelOpen, setIsAccessibilityPanelOpen] = useState(false);
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    highContrast: isHighContrastMode(),
    reducedMotion: isReducedMotionPreferred(),
    largeText: false,
    announceChanges: true,
    keyboardNavigation: true,
    screenReaderOptimized: false,
    focusVisible: true,
    colorBlindFriendly: false,
    fontSize: 16,
    lineHeight: 1.6,
    letterSpacing: 0,
  });

  const { announce } = useAccessibility();
  const updateUI = useAppStore(state => state.updateUI);

  // Initialize accessibility preferences from system
  useEffect(() => {
    const systemPreferences = {
      highContrast: isHighContrastMode(),
      reducedMotion: isReducedMotionPreferred(),
    };
    
    setPreferences(prev => ({ ...prev, ...systemPreferences }));
  }, []);

  // Apply accessibility preferences to the document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (preferences.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Large text
    if (preferences.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Screen reader optimized
    if (preferences.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }

    // Focus visible
    if (preferences.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }

    // Color blind friendly
    if (preferences.colorBlindFriendly) {
      root.classList.add('color-blind-friendly');
    } else {
      root.classList.remove('color-blind-friendly');
    }

    // Typography settings
    root.style.setProperty('--accessibility-font-size', `${preferences.fontSize}px`);
    root.style.setProperty('--accessibility-line-height', preferences.lineHeight.toString());
    root.style.setProperty('--accessibility-letter-spacing', `${preferences.letterSpacing}px`);

  }, [preferences]);

  // Listen for system preference changes
  useEffect(() => {
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, highContrast: e.matches }));
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    highContrastQuery.addEventListener('change', handleHighContrastChange);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  const toggleAccessibilityPanel = () => {
    setIsAccessibilityPanelOpen(!isAccessibilityPanelOpen);
    announce(isAccessibilityPanelOpen ? 'Accessibility panel closed' : 'Accessibility panel opened');
  };

  const updatePreferences = (updates: Partial<AccessibilityPreferences>) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates };
      
      // Announce significant changes
      Object.keys(updates).forEach(key => {
        const value = updates[key as keyof AccessibilityPreferences];
        if (typeof value === 'boolean') {
          announce(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value ? 'enabled' : 'disabled'}`);
        }
      });
      
      return newPreferences;
    });

    // Update app store accessibility settings
    updateUI({
      accessibility: {
        ...useAppStore.getState().ui.accessibility,
        highContrast: updates.highContrast ?? preferences.highContrast,
        reducedMotion: updates.reducedMotion ?? preferences.reducedMotion,
        fontSize: (() => {
          if (updates.fontSize) return 'large';
          if (updates.largeText) return 'large';
          return useAppStore.getState().ui.accessibility.fontSize;
        })(),
      },
    });
  };

  const announceToScreen = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (preferences.announceChanges) {
      announce(message, priority);
    }
  };

  const contextValue: AccessibilityContextType = {
    isAccessibilityPanelOpen,
    toggleAccessibilityPanel,
    preferences,
    updatePreferences,
    announceToScreen,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      <AccessibilityPanel />
      <AccessibilityFloatingButton />
    </AccessibilityContext.Provider>
  );
};

const AccessibilityPanel: React.FC = () => {
  const context = useContext(AccessibilityContext);
  if (!context) return null;

  const { isAccessibilityPanelOpen, toggleAccessibilityPanel, preferences, updatePreferences } = context;

  return (
    <AnimatePresence>
      {isAccessibilityPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={toggleAccessibilityPanel}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 h-full w-96 bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
            role="dialog"
            aria-label="Accessibility Settings"
            aria-modal="true"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Accessibility Settings
                </h2>
                <AccessibleButton
                  variant="ghost"
                  size="icon"
                  onClick={toggleAccessibilityPanel}
                  ariaLabel="Close accessibility settings"
                >
                  <Eye className="w-4 h-4" />
                </AccessibleButton>
              </div>

              <div className="space-y-6">
                {/* Visual Preferences */}
                <section>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Visual
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="high-contrast" className="text-sm font-medium">
                        High Contrast
                      </label>
                      <button
                        id="high-contrast"
                        role="switch"
                        aria-checked={preferences.highContrast}
                        onClick={() => updatePreferences({ highContrast: !preferences.highContrast })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                          preferences.highContrast ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                            preferences.highContrast ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label htmlFor="large-text" className="text-sm font-medium">
                        Large Text
                      </label>
                      <button
                        id="large-text"
                        role="switch"
                        aria-checked={preferences.largeText}
                        onClick={() => updatePreferences({ largeText: !preferences.largeText })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                          preferences.largeText ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                            preferences.largeText ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label htmlFor="color-blind-friendly" className="text-sm font-medium">
                        Color Blind Friendly
                      </label>
                      <button
                        id="color-blind-friendly"
                        role="switch"
                        aria-checked={preferences.colorBlindFriendly}
                        onClick={() => updatePreferences({ colorBlindFriendly: !preferences.colorBlindFriendly })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                          preferences.colorBlindFriendly ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                            preferences.colorBlindFriendly ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label htmlFor="font-size" className="text-sm font-medium block mb-2">
                        Font Size: {preferences.fontSize}px
                      </label>
                      <input
                        id="font-size"
                        type="range"
                        min="12"
                        max="24"
                        value={preferences.fontSize}
                        onChange={(e) => updatePreferences({ fontSize: parseInt(e.target.value) })}
                        className="w-full accent-primary"
                      />
                    </div>
                  </div>
                </section>

                {/* Motion Preferences */}
                <section>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Motion
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="reduced-motion" className="text-sm font-medium">
                        Reduced Motion
                      </label>
                      <button
                        id="reduced-motion"
                        role="switch"
                        aria-checked={preferences.reducedMotion}
                        onClick={() => updatePreferences({ reducedMotion: !preferences.reducedMotion })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                          preferences.reducedMotion ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                            preferences.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </section>

                {/* Navigation Preferences */}
                <section>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <Keyboard className="w-4 h-4" />
                    Navigation
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="keyboard-navigation" className="text-sm font-medium">
                        Keyboard Navigation
                      </label>
                      <button
                        id="keyboard-navigation"
                        role="switch"
                        aria-checked={preferences.keyboardNavigation}
                        onClick={() => updatePreferences({ keyboardNavigation: !preferences.keyboardNavigation })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                          preferences.keyboardNavigation ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                            preferences.keyboardNavigation ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label htmlFor="focus-visible" className="text-sm font-medium">
                        Enhanced Focus Indicators
                      </label>
                      <button
                        id="focus-visible"
                        role="switch"
                        aria-checked={preferences.focusVisible}
                        onClick={() => updatePreferences({ focusVisible: !preferences.focusVisible })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                          preferences.focusVisible ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                            preferences.focusVisible ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </section>

                {/* Screen Reader Preferences */}
                <section>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Screen Reader
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="announce-changes" className="text-sm font-medium">
                        Announce Changes
                      </label>
                      <button
                        id="announce-changes"
                        role="switch"
                        aria-checked={preferences.announceChanges}
                        onClick={() => updatePreferences({ announceChanges: !preferences.announceChanges })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                          preferences.announceChanges ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                            preferences.announceChanges ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label htmlFor="screen-reader-optimized" className="text-sm font-medium">
                        Screen Reader Optimized
                      </label>
                      <button
                        id="screen-reader-optimized"
                        role="switch"
                        aria-checked={preferences.screenReaderOptimized}
                        onClick={() => updatePreferences({ screenReaderOptimized: !preferences.screenReaderOptimized })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                          preferences.screenReaderOptimized ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                            preferences.screenReaderOptimized ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </section>

                {/* Reset Button */}
                <div className="pt-4 border-t border-border">
                  <AccessibleButton
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setPreferences({
                        highContrast: isHighContrastMode(),
                        reducedMotion: isReducedMotionPreferred(),
                        largeText: false,
                        announceChanges: true,
                        keyboardNavigation: true,
                        screenReaderOptimized: false,
                        focusVisible: true,
                        colorBlindFriendly: false,
                        fontSize: 16,
                        lineHeight: 1.6,
                        letterSpacing: 0,
                      });
                      announceToScreen('Accessibility settings reset to defaults');
                    }}
                  >
                    Reset to Defaults
                  </AccessibleButton>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const AccessibilityFloatingButton: React.FC = () => {
  const context = useContext(AccessibilityContext);
  if (!context) return null;

  const { toggleAccessibilityPanel } = context;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-4 right-4 z-40"
    >
      <AccessibleButton
        variant="default"
        size="icon"
        onClick={toggleAccessibilityPanel}
        ariaLabel="Open accessibility settings"
        tooltip="Accessibility Settings"
        className="h-12 w-12 rounded-full shadow-lg"
      >
        <Eye className="w-5 h-5" />
      </AccessibleButton>
    </motion.div>
  );
};

export const useAccessibilityContext = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider');
  }
  return context;
};