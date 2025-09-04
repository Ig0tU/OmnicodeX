import React from 'react';
import { Editor, OnMount, OnChange } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { motion } from 'framer-motion';
import { 
  Play, 
  Save, 
  GitBranch, 
  Search, 
  Replace, 
  Settings, 
  Maximize2, 
  Minimize2,
  Code,
  FileText,
  Database,
  Globe
} from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useAppStore } from '../../store';

interface MonacoEditorProps {
  value: string;
  language: string;
  theme?: 'light' | 'dark' | 'high-contrast';
  readonly?: boolean;
  onChange?: (value: string | undefined) => void;
  onSave?: () => void;
  onRun?: () => void;
  className?: string;
  height?: string | number;
  minimap?: boolean;
  wordWrap?: boolean;
  lineNumbers?: boolean;
  folding?: boolean;
  autoFormat?: boolean;
  suggestions?: boolean;
  bracketMatching?: boolean;
  colorDecorators?: boolean;
  rulers?: number[];
}

interface FileTab {
  id: string;
  name: string;
  language: string;
  content: string;
  isDirty: boolean;
  isActive: boolean;
}

const languageIcons: Record<string, React.ComponentType<any>> = {
  typescript: Code,
  javascript: Code,
  tsx: Code,
  jsx: Code,
  json: FileText,
  yaml: FileText,
  markdown: FileText,
  sql: Database,
  html: Globe,
  css: Globe,
  scss: Globe,
  python: Code,
  java: Code,
  csharp: Code,
  go: Code,
  rust: Code,
};

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  language,
  theme = 'dark',
  readonly = false,
  onChange,
  onSave,
  onRun,
  className = '',
  height = '100%',
  minimap = true,
  wordWrap = true,
  lineNumbers = true,
  folding = true,
  autoFormat = true,
  suggestions = true,
  bracketMatching = true,
  colorDecorators = true,
  rulers = [80, 120],
}) => {
  const [editor, setEditor] = React.useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showFind, setShowFind] = React.useState(false);
  const [showReplace, setShowReplace] = React.useState(false);
  const [tabs, setTabs] = React.useState<FileTab[]>([
    {
      id: 'main',
      name: `main.${language === 'typescript' ? 'ts' : language}`,
      language,
      content: value,
      isDirty: false,
      isActive: true,
    },
  ]);

  const ui = useAppStore(state => state.ui);

  // Hotkeys
  useHotkeys('ctrl+s, cmd+s', (e) => {
    e.preventDefault();
    onSave?.();
    markTabClean();
  });

  useHotkeys('ctrl+f, cmd+f', (e) => {
    e.preventDefault();
    setShowFind(true);
    editor?.getAction('actions.find')?.run();
  });

  useHotkeys('ctrl+h, cmd+h', (e) => {
    e.preventDefault();
    setShowReplace(true);
    editor?.getAction('editor.action.startFindReplaceAction')?.run();
  });

  useHotkeys('ctrl+shift+f, cmd+shift+f', (e) => {
    e.preventDefault();
    if (autoFormat) {
      editor?.getAction('editor.action.formatDocument')?.run();
    }
  });

  useHotkeys('f5', (e) => {
    e.preventDefault();
    onRun?.();
  });

  useHotkeys('f11', (e) => {
    e.preventDefault();
    setIsFullscreen(!isFullscreen);
  });

  const handleEditorDidMount: OnMount = (editorInstance, monacoInstance) => {
    setEditor(editorInstance);

    // Configure Monaco
    monacoInstance.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'regexp', foreground: 'D16969' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#f1f5f9',
        'editorCursor.foreground': '#3b82f6',
        'editor.lineHighlightBackground': '#1e293b',
        'editorLineNumber.foreground': '#64748b',
        'editor.selectionBackground': '#334155',
        'editor.inactiveSelectionBackground': '#1e293b',
      },
    });

    monacoInstance.editor.setTheme('custom-dark');

    // Add custom commands
    editorInstance.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
      onSave?.();
      markTabClean();
    });

    editorInstance.addCommand(monacoInstance.KeyCode.F5, () => {
      onRun?.();
    });

    // Auto-complete and IntelliSense configuration
    if (suggestions) {
      monacoInstance.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
        noSuggestionDiagnostics: false,
      });

      monacoInstance.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monacoInstance.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        allowJs: true,
        checkJs: true,
        jsx: monacoInstance.languages.typescript.JsxEmit.ReactJSX,
      });
    }

    // Code folding configuration
    if (folding) {
      editorInstance.updateOptions({
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'always',
      });
    }

    // Bracket matching
    if (bracketMatching) {
      editorInstance.updateOptions({
        matchBrackets: 'always',
        bracketPairColorization: { enabled: true },
      });
    }

    // Color decorators for CSS
    if (colorDecorators && (language === 'css' || language === 'scss' || language === 'less')) {
      monacoInstance.languages.registerColorProvider(language, {
        provideColorPresentations: (model, colorInfo) => {
          const color = colorInfo.color;
          return [
            {
              label: `rgb(${Math.round(color.red * 255)}, ${Math.round(color.green * 255)}, ${Math.round(color.blue * 255)})`,
            },
            {
              label: `rgba(${Math.round(color.red * 255)}, ${Math.round(color.green * 255)}, ${Math.round(color.blue * 255)}, ${color.alpha})`,
            },
          ];
        },
        provideDocumentColors: (model) => {
          const colors: any[] = [];
          const text = model.getValue();
          const colorRegex = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g;
          let match;

          while ((match = colorRegex.exec(text)) !== null) {
            const startPos = model.getPositionAt(match.index);
            const endPos = model.getPositionAt(match.index + match[0].length);
            colors.push({
              color: {
                red: parseInt(match[1]) / 255,
                green: parseInt(match[2]) / 255,
                blue: parseInt(match[3]) / 255,
                alpha: 1,
              },
              range: {
                startLineNumber: startPos.lineNumber,
                startColumn: startPos.column,
                endLineNumber: endPos.lineNumber,
                endColumn: endPos.column,
              },
            });
          }
          return colors;
        },
      });
    }

    // Focus the editor
    editorInstance.focus();
  };

  const handleEditorChange: OnChange = (newValue) => {
    if (newValue !== value) {
      markTabDirty();
    }
    onChange?.(newValue);
  };

  const markTabDirty = () => {
    setTabs(prev => prev.map(tab => 
      tab.isActive ? { ...tab, isDirty: true } : tab
    ));
  };

  const markTabClean = () => {
    setTabs(prev => prev.map(tab => 
      tab.isActive ? { ...tab, isDirty: false } : tab
    ));
  };

  const switchTab = (tabId: string) => {
    setTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === tabId,
    })));
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId);
      if (filtered.length === 0) return prev;
      
      // If closing active tab, activate the next one
      const closingTab = prev.find(tab => tab.id === tabId);
      if (closingTab?.isActive && filtered.length > 0) {
        filtered[0].isActive = true;
      }
      
      return filtered;
    });
  };

  const getLanguageIcon = (lang: string) => {
    const Icon = languageIcons[lang] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const editorOptions = {
    readOnly: readonly,
    minimap: { enabled: minimap },
    wordWrap: wordWrap ? 'on' : 'off',
    lineNumbers: lineNumbers ? 'on' : 'off',
    folding,
    suggestOnTriggerCharacters: suggestions,
    quickSuggestions: suggestions,
    parameterHints: { enabled: suggestions },
    autoIndent: 'full',
    formatOnType: autoFormat,
    formatOnPaste: autoFormat,
    rulers,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    renderWhitespace: 'selection',
    renderControlCharacters: false,
    renderIndentGuides: true,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: ui.editorSettings.fontSize,
    fontFamily: ui.editorSettings.fontFamily,
    tabSize: ui.editorSettings.tabSize,
    insertSpaces: true,
    detectIndentation: false,
  };

  const activeTab = tabs.find(tab => tab.isActive);

  return (
    <motion.div
      className={`relative flex flex-col h-full ${className} ${
        isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''
      }`}
      initial={false}
      animate={{
        scale: isFullscreen ? 1 : 1,
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Tabs */}
      <div className="flex items-center bg-card/20 border-b border-border">
        <div className="flex-1 flex items-center overflow-x-auto">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm border-r border-border
                transition-colors duration-200 min-w-0 group
                ${tab.isActive 
                  ? 'bg-background text-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {getLanguageIcon(tab.language)}
              <span className="truncate">{tab.name}</span>
              {tab.isDirty && <div className="w-2 h-2 bg-primary rounded-full" />}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => closeTab(tab.id, e)}
                  className="opacity-0 group-hover:opacity-100 ml-1 hover:bg-destructive/20 rounded p-0.5 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.button>
          ))}
        </div>

        {/* Editor Controls */}
        <div className="flex items-center gap-1 px-2 border-l border-border">
          <button
            onClick={() => setShowFind(!showFind)}
            className="p-1.5 rounded hover:bg-secondary/50 transition-colors"
            title="Find (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowReplace(!showReplace)}
            className="p-1.5 rounded hover:bg-secondary/50 transition-colors"
            title="Find & Replace (Ctrl+H)"
          >
            <Replace className="w-4 h-4" />
          </button>

          {onSave && (
            <button
              onClick={() => {
                onSave();
                markTabClean();
              }}
              className="p-1.5 rounded hover:bg-secondary/50 transition-colors text-green-400"
              title="Save (Ctrl+S)"
            >
              <Save className="w-4 h-4" />
            </button>
          )}

          {onRun && (
            <button
              onClick={onRun}
              className="p-1.5 rounded hover:bg-secondary/50 transition-colors text-blue-400"
              title="Run (F5)"
            >
              <Play className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-secondary/50 transition-colors"
            title="Toggle Fullscreen (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height={height}
          language={activeTab?.language || language}
          value={activeTab?.content || value}
          theme={theme === 'dark' ? 'custom-dark' : theme}
          options={editorOptions as any}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          loading={
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
              />
            </div>
          }
        />

        {/* Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-card/90 backdrop-blur-sm border-t border-border px-3 py-1 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Line {editor?.getPosition()?.lineNumber || 1}, Column {editor?.getPosition()?.column || 1}</span>
            <span>{activeTab?.language?.toUpperCase() || language.toUpperCase()}</span>
            <span>{value.split('\n').length} lines</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span>UTF-8</span>
            {activeTab?.isDirty && <span className="text-primary">● Unsaved changes</span>}
            <span>Spaces: {ui.editorSettings.tabSize}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};