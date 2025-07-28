import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code, Play, Save, GitBranch, Zap, Monitor } from 'lucide-react';

interface CodeEditorProps {
  activeRequest: string | null;
}

export const CodeEditor = ({ activeRequest }: CodeEditorProps) => {
  const [activeFile, setActiveFile] = useState('App.tsx');
  const [editorContent, setEditorContent] = useState('');
  const [isBuilderActive, setIsBuilderActive] = useState(false);
  const [builderProgress, setBuilderProgress] = useState(0);

  const mockFiles = {
    'App.tsx': `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Header />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;`,
    'UserAuth.tsx': `import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

interface UserAuthProps {
  onLogin: (credentials: LoginCredentials) => void;
  onRegister: (userData: RegisterData) => void;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  username: string;
  confirmPassword: string;
}

export const UserAuth = ({ onLogin, onRegister }: UserAuthProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      await onLogin({
        email: formData.email,
        password: formData.password
      });
    } else {
      await onRegister(formData as RegisterData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto p-6 bg-card rounded-lg border border-border"
    >
      <div className="text-center mb-6">
        <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <div className="relative">
              <User className="w-5 h-5 text-muted-foreground absolute left-3 top-3" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/50"
                placeholder="Enter username"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/50"
            placeholder="Enter email"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-2 pr-10 border border-border rounded-md focus:ring-2 focus:ring-primary/50"
              placeholder="Enter password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {!isLogin && (
          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/50"
              placeholder="Confirm password"
              required
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          {isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-primary hover:underline text-sm"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </motion.div>
  );
};`
  };

  useEffect(() => {
    if (activeRequest && mockFiles[activeFile as keyof typeof mockFiles]) {
      setEditorContent(mockFiles[activeFile as keyof typeof mockFiles]);
    }
  }, [activeFile, activeRequest]);

  useEffect(() => {
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
              onClick={() => setActiveFile(tab)}
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
        <div className="absolute inset-0 p-4">
          <pre className="text-sm font-mono text-foreground leading-relaxed h-full overflow-auto">
            <code>{editorContent}</code>
          </pre>
        </div>
        
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