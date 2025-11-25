import React from 'react';
import { motion } from 'framer-motion';
import { Code, Sun, Moon, Monitor, Cloud, Zap } from 'lucide-react';
import { useAppStore } from '../../store';

const Header = () => {
  const { theme, updateUI } = useAppStore((state) => ({
    theme: state.ui.editorSettings.theme,
    updateUI: state.updateUI,
  }));

  const toggleTheme = () => {
    updateUI({ editorSettings: { ...useAppStore.getState().ui.editorSettings, theme: theme === 'dark' ? 'light' : 'dark' } });
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border/20 bg-card/10 backdrop-blur-sm"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Code className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-text bg-clip-text text-transparent">
                CloudIDE - Autonomous Development Environment
              </h1>
              <p className="text-sm text-muted-foreground">
                AI builders working in distributed cloud environments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-muted-foreground">Connected to AWS Cloud</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-secondary/50"
                aria-label={theme === 'dark' ? 'Activate light mode' : 'Activate dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-1">
                <Monitor className="w-4 h-4 text-accent" />
                <Cloud className="w-4 h-4 text-primary" />
                <Zap className="w-4 h-4 text-cyan" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
