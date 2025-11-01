import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Play, Save, GitBranch, Zap, Monitor, Sun, Moon } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { mockFiles } from '../lib/editor-utils';

interface CodeEditorProps {
  activeRequest: string | null;
}

export const CodeEditor = ({ activeRequest }: CodeEditorProps) => {
  const [activeFile, setActiveFile] = useState('App.tsx');
  const [editorContent, setEditorContent] = useState(mockFiles['App.tsx']);
  const [isBuilderActive, setIsBuilderActive] = useState(false);
  const [builderProgress, setBuilderProgress] = useState(0);
  const [theme, setTheme] = useState('vs-dark');

  const handleFileChange = (file: string) => {
    setActiveFile(file);
    setEditorContent(mockFiles[file as keyof typeof mockFiles]);
  };

  const toggleTheme = () => {
    setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark');
  };

  React.useEffect(() => {
    if (activeRequest) {
      setIsBuilderActive(true);
      setBuilderProgress(0);

      const interval = setInterval(() => {
        setBuilderProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          if (newProgress >= 100) {
            setIsBuilderActive(false);
            return 100;
          }
          return newProgress;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeRequest]);

  const openTabs = ['App.tsx', 'UserAuth.tsx', 'api/users.ts'];

  return (
    <div className="bg-card/20 backdrop-blur-sm border border-border rounded-lg h-full flex flex-col">
      {/* Editor Header */}
      <div className="border-b border-border p-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Cloud Editor</span>
            {isBuilderActive && (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-xs text-primary">Builder Active</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 hover:bg-secondary/50 rounded" onClick={toggleTheme}>
              {theme === 'vs-dark' ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
            </button>
            <button className="p-1 hover:bg-secondary/50 rounded">
              <Save className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-1 hover:bg-secondary/50 rounded">
              <Play className="w-4 h-4 text-green-400" />
            </button>
            <button className="p-1 hover:bg-secondary/50 rounded">
              <GitBranch className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* File Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {openTabs.map(tab => (
            <button
              key={tab}
              onClick={() => handleFileChange(tab)}
              className={`px-3 py-1 rounded-t text-xs font-mono whitespace-nowrap ${
                activeFile === tab
                  ? 'bg-background text-foreground border-t border-l border-r border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Builder Progress */}
        {isBuilderActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Monitor className="w-3 h-3" />
              <span>Frontend Builder working on {activeFile}</span>
              <span className="ml-auto">{Math.round(builderProgress)}%</span>
            </div>
            <div className="w-full bg-background/50 rounded-full h-1 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${builderProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language="typescript"
          theme={theme}
          value={editorContent}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
        {isBuilderActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className="absolute inset-0 bg-primary/10 pointer-events-none"
          >
            <div className="absolute top-4 right-4 bg-primary/20 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm text-primary font-medium">AI Builder Writing Code</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Editor Footer */}
      <div className="border-t border-border p-2 text-xs text-muted-foreground">
        <div className="flex justify-between items-center">
          <span>TypeScript • React • {editorContent.split('\n').length} lines</span>
          <span>cloud-ide-1.aws.dev</span>
        </div>
      </div>
    </div>
  );
};
