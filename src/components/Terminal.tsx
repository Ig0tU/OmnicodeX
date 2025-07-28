import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface TerminalLog {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error' | 'command';
  message: string;
  builderId?: string;
}

interface TerminalProps {
  activeRequest: string | null;
}

export const Terminal = ({ activeRequest }: TerminalProps) => {
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: '1',
      timestamp: new Date(),
      type: 'info',
      message: 'CloudIDE Terminal v2.1.0 - Autonomous Builder Environment',
    },
    {
      id: '2',
      timestamp: new Date(),
      type: 'info',
      message: 'Ready for builder deployment...',
    }
  ]);

  const terminalRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  useEffect(() => {
    if (activeRequest) {
      const builderLogs = [
        { type: 'command', message: '$ cloudide deploy-builders --request="' + activeRequest + '"', builderId: 'system' },
        { type: 'info', message: 'Initializing builder environments...', builderId: 'system' },
        { type: 'info', message: 'Frontend Builder: Spinning up React/TypeScript environment', builderId: 'frontend' },
        { type: 'info', message: 'Backend Builder: Initializing Node.js API workspace', builderId: 'backend' },
        { type: 'info', message: 'DevOps Builder: Setting up CI/CD pipeline', builderId: 'devops' },
        { type: 'info', message: 'Security Builder: Configuring security policies', builderId: 'security' },
        { type: 'success', message: 'All builders deployed successfully', builderId: 'system' },
        { type: 'command', message: '$ frontend-builder analyze-requirements', builderId: 'frontend' },
        { type: 'info', message: 'Analyzing UI/UX requirements...', builderId: 'frontend' },
        { type: 'info', message: 'Installing dependencies: react, typescript, framer-motion', builderId: 'frontend' },
        { type: 'success', message: 'Component scaffolding complete', builderId: 'frontend' },
        { type: 'command', message: '$ backend-builder setup-api', builderId: 'backend' },
        { type: 'info', message: 'Setting up REST API endpoints...', builderId: 'backend' },
        { type: 'info', message: 'Configuring database schemas...', builderId: 'backend' },
        { type: 'success', message: 'API routes configured', builderId: 'backend' },
        { type: 'command', message: '$ security-builder audit-code', builderId: 'security' },
        { type: 'info', message: 'Running OWASP security checks...', builderId: 'security' },
        { type: 'success', message: 'Security audit passed', builderId: 'security' },
        { type: 'command', message: '$ devops-builder create-pipeline', builderId: 'devops' },
        { type: 'info', message: 'Generating Docker configuration...', builderId: 'devops' },
        { type: 'info', message: 'Setting up automated testing...', builderId: 'devops' },
        { type: 'success', message: 'CI/CD pipeline ready', builderId: 'devops' },
        { type: 'info', message: 'Build process complete. Ready for deployment.', builderId: 'system' }
      ];

      builderLogs.forEach((log, index) => {
        setTimeout(() => {
          setLogs(prev => [...prev, {
            id: Date.now().toString() + index,
            timestamp: new Date(),
            type: log.type as any,
            message: log.message,
            builderId: log.builderId
          }]);
        }, index * 1500);
      });
    }
  }, [activeRequest]);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'command': return 'text-cyan';
      default: return 'text-muted-foreground';
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'warning': return <AlertCircle className="w-3 h-3 text-yellow-400" />;
      case 'error': return <AlertCircle className="w-3 h-3 text-red-400" />;
      case 'command': return <Zap className="w-3 h-3 text-cyan" />;
      default: return <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />;
    }
  };

  const getBuilderColor = (builderId?: string) => {
    switch (builderId) {
      case 'frontend': return 'text-blue-400';
      case 'backend': return 'text-green-400';
      case 'devops': return 'text-purple-400';
      case 'security': return 'text-red-400';
      case 'system': return 'text-cyan';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card/20 backdrop-blur-sm border border-border rounded-lg h-full flex flex-col">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <TerminalIcon className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Build Terminal</span>
        <div className="ml-auto flex gap-1">
          <div className="w-2 h-2 bg-red-400 rounded-full" />
          <div className="w-2 h-2 bg-yellow-400 rounded-full" />
          <div className="w-2 h-2 bg-green-400 rounded-full" />
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="flex-1 p-3 overflow-y-auto font-mono text-sm bg-background/20"
      >
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 py-1 group"
            >
              <span className="text-xs text-muted-foreground/70 min-w-[60px]">
                {log.timestamp.toLocaleTimeString().slice(0, -3)}
              </span>
              
              {getLogIcon(log.type)}
              
              {log.builderId && (
                <span className={`text-xs font-medium min-w-[80px] ${getBuilderColor(log.builderId)}`}>
                  [{log.builderId}]
                </span>
              )}
              
              <span className={`${getLogColor(log.type)} leading-relaxed`}>
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Cursor */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-cyan">$</span>
          <div className="w-2 h-4 bg-primary animate-pulse" />
        </div>
      </div>

      {/* Terminal Footer */}
      <div className="border-t border-border p-2 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Connected to: cloud-builder-cluster.aws.dev</span>
          <span>{logs.length} log entries</span>
        </div>
      </div>
    </div>
  );
};