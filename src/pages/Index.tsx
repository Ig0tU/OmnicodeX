import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChatInterface } from '../components/ChatInterface';
import { BuilderPanel } from '../components/BuilderPanel';
import { FileExplorer } from '../components/FileExplorer';
import { CodeEditor } from '../components/CodeEditor';
import { Terminal } from '../components/Terminal';
import { Monitor, Cloud, Zap, Code, Database, Shield } from 'lucide-react';

const Index = () => {
  const [activeRequest, setActiveRequest] = useState<string | null>(null);

  const handleNewRequest = (request: string) => {
    setActiveRequest(request);
  };

  return (
    <div className="min-h-screen bg-gradient-primary text-foreground">
      {/* Header */}
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
              
              <div className="flex items-center gap-1">
                <Monitor className="w-4 h-4 text-accent" />
                <Cloud className="w-4 h-4 text-primary" />
                <Zap className="w-4 h-4 text-cyan" />
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main IDE Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - File Explorer & Builders */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 border-r border-border/20 bg-card/5 backdrop-blur-sm"
        >
          <div className="h-full flex flex-col">
            <div className="flex-1 p-3">
              <FileExplorer activeRequest={activeRequest} />
            </div>
            <div className="h-80 p-3 border-t border-border/20">
              <BuilderPanel activeRequest={activeRequest} />
            </div>
          </div>
        </motion.div>

        {/* Center - Code Editor */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          <div className="flex-1 p-3">
            <CodeEditor activeRequest={activeRequest} />
          </div>
          <div className="h-64 p-3 border-t border-border/20">
            <Terminal activeRequest={activeRequest} />
          </div>
        </motion.div>

        {/* Right Sidebar - Chat Interface */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-96 border-l border-border/20 bg-card/5 backdrop-blur-sm"
        >
          <div className="h-full p-3">
            <ChatInterface onNewRequest={handleNewRequest} />
          </div>
        </motion.div>
      </div>

      {/* Status Bar */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border-t border-border/20 bg-card/10 backdrop-blur-sm px-6 py-2"
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-3 h-3" />
              <span>4 builders active</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3" />
              <span>Security: All checks passed</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="w-3 h-3" />
              <span>Memory: 2.4GB / 8GB</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span>Region: us-east-1</span>
            <span>Uptime: 2h 34m</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default Index;