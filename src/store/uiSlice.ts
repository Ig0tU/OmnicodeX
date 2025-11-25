import { StateCreator } from 'zustand';
import { AppState, AppActions } from './index';
import { UIState } from '../types';

export interface UiSlice {
  ui: UIState;
  updateUI: (updates: Partial<UIState>) => void;
  setActiveTab: (tab: UIState['activeTab']) => void;
  toggleSidebar: () => void;
  updateTheme: (theme: Partial<UIState['theme']>) => void;
}

export const createUiSlice: StateCreator<
  AppState & AppActions,
  [['zustand/immer', never]],
  [],
  UiSlice
> = (set) => ({
    ui: {
        activeTab: 'editor',
        selectedFiles: [],
        editorSettings: {
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
          theme: 'dark',
          tabSize: 2,
          wordWrap: true,
          lineNumbers: true,
          minimap: true,
          autoSave: true,
          formatOnSave: true,
        },
        layoutConfig: {
          sidebarWidth: 280,
          panelHeight: 250,
          showStatusBar: true,
          showActivityBar: true,
          workbenchLayout: 'default',
        },
        theme: {
          name: 'Dark Pro',
          colors: {
            primary: '#3b82f6',
            secondary: '#64748b',
            accent: '#10b981',
            background: '#0f172a',
            foreground: '#f1f5f9',
            border: '#334155',
            error: '#ef4444',
            warning: '#f59e0b',
            success: '#10b981',
            info: '#3b82f6',
          },
          customizations: {},
        },
        accessibility: {
          enableScreenReader: false,
          highContrast: false,
          reducedMotion: false,
          fontSize: 'medium',
          announceStatus: true,
          keyboardShortcuts: {
            'editor.save': 'Ctrl+S',
            'editor.find': 'Ctrl+F',
            'editor.replace': 'Ctrl+H',
            'workbench.toggleSidebar': 'Ctrl+B',
            'workbench.togglePanel': 'Ctrl+J',
          },
        },
      },
  updateUI: (updates) => set((state) => {
    Object.assign(state.ui, updates);
  }),
  setActiveTab: (tab) => set((state) => {
    state.ui.activeTab = tab;
  }),
  toggleSidebar: () => set((state) => {
    state.ui.layoutConfig.sidebarWidth = state.ui.layoutConfig.sidebarWidth > 0 ? 0 : 280;
  }),
  updateTheme: (theme) => set((state) => {
    Object.assign(state.ui.theme, theme);
  }),
});