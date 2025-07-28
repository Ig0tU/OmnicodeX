import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, Database, Cloud, Shield, Zap, CheckCircle, AlertCircle, Clock, Cpu } from 'lucide-react';

interface Builder {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'devops' | 'security';
  status: 'idle' | 'analyzing' | 'coding' | 'testing' | 'deploying' | 'complete' | 'error';
  progress: number;
  currentTask: string;
  icon: any;
  environment: string;
}

interface BuilderPanelProps {
  activeRequest: string | null;
}

export const BuilderPanel = ({ activeRequest }: BuilderPanelProps) => {
  const [builders, setBuilders] = useState<Builder[]>([
    {
      id: 'frontend',
      name: 'Frontend Builder',
      type: 'frontend',
      status: 'idle',
      progress: 0,
      currentTask: 'Waiting for deployment...',
      icon: Code,
      environment: 'cloud-ide-1.aws.dev'
    },
    {
      id: 'backend',
      name: 'Backend Builder', 
      type: 'backend',
      status: 'idle',
      progress: 0,
      currentTask: 'Waiting for deployment...',
      icon: Database,
      environment: 'cloud-ide-2.aws.dev'
    },
    {
      id: 'devops',
      name: 'DevOps Builder',
      type: 'devops', 
      status: 'idle',
      progress: 0,
      currentTask: 'Waiting for deployment...',
      icon: Cloud,
      environment: 'cloud-ide-3.aws.dev'
    },
    {
      id: 'security',
      name: 'Security Builder',
      type: 'security',
      status: 'idle', 
      progress: 0,
      currentTask: 'Waiting for deployment...',
      icon: Shield,
      environment: 'cloud-ide-4.aws.dev'
    }
  ]);

  useEffect(() => {
    if (activeRequest) {
      // Simulate builder activation
      setBuilders(prev => prev.map(builder => ({
        ...builder,
        status: 'analyzing',
        progress: 0,
        currentTask: 'Analyzing requirements...'
      })));

      // Simulate progressive work
      const intervals: NodeJS.Timeout[] = [];
      
      builders.forEach((builder, index) => {
        const interval = setInterval(() => {
          setBuilders(prev => prev.map(b => {
            if (b.id === builder.id) {
              const newProgress = Math.min(b.progress + Math.random() * 15, 100);
              let newStatus = b.status;
              let newTask = b.currentTask;

              if (newProgress > 20 && b.status === 'analyzing') {
                newStatus = 'coding';
                newTask = 'Generating code...';
              } else if (newProgress > 60 && b.status === 'coding') {
                newStatus = 'testing';
                newTask = 'Running tests...';
              } else if (newProgress > 90 && b.status === 'testing') {
                newStatus = 'deploying';
                newTask = 'Deploying to cloud...';
              } else if (newProgress >= 100) {
                newStatus = 'complete';
                newTask = 'Build complete!';
              }

              return {
                ...b,
                progress: newProgress,
                status: newStatus,
                currentTask: newTask
              };
            }
            return b;
          }));
        }, 1500 + (index * 500));

        intervals.push(interval);
      });

      return () => {
        intervals.forEach(interval => clearInterval(interval));
      };
    }
  }, [activeRequest]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'text-muted-foreground';
      case 'analyzing': return 'text-cyan';
      case 'coding': return 'text-primary';
      case 'testing': return 'text-yellow-400';
      case 'deploying': return 'text-orange-400';
      case 'complete': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'idle': return <Clock className="w-4 h-4 text-muted-foreground" />;
      default: return <Cpu className="w-4 h-4 animate-spin text-primary" />;
    }
  };

  return (
    <div className="bg-card/20 backdrop-blur-sm border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Autonomous Builders</h3>
        <div className="ml-auto text-sm text-muted-foreground">
          {builders.filter(b => b.status === 'complete').length}/{builders.length} Complete
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {builders.map((builder) => (
            <motion.div
              key={builder.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-secondary/30 rounded-lg p-3 border border-border/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <builder.icon className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{builder.name}</span>
                  {getStatusIcon(builder.status)}
                </div>
                <span className={`text-xs font-mono ${getStatusColor(builder.status)}`}>
                  {builder.status.toUpperCase()}
                </span>
              </div>

              <div className="text-xs text-muted-foreground mb-2">
                {builder.currentTask}
              </div>

              <div className="text-xs text-muted-foreground/70 mb-2">
                Environment: {builder.environment}
              </div>

              <div className="w-full bg-background/50 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${builder.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">
                  {Math.round(builder.progress)}%
                </span>
                {builder.status !== 'idle' && (
                  <span className="text-xs text-primary font-mono">
                    {builder.status === 'complete' ? '✓ Ready' : 'Working...'}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};