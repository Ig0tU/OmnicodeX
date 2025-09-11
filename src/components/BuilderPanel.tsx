import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, Database, Cloud, Shield, Zap, CheckCircle, AlertCircle, Clock, Cpu } from 'lucide-react';

import { useActiveTasks } from '../store';

export const BuilderPanel = () => {
  const tasks = useActiveTasks();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'text-muted-foreground';
      case 'in-progress': return 'text-primary';
      case 'blocked': return 'text-yellow-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'cancelled': return 'text-gray-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
      case 'cancelled':
       return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'queued': return <Clock className="w-4 h-4 text-muted-foreground" />;
      default: return <Cpu className="w-4 h-4 animate-spin text-primary" />;
    }
  };

  return (
    <div className="bg-card/20 backdrop-blur-sm border border-border rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Active Build Tasks</h3>
        <div className="ml-auto text-sm text-muted-foreground">
          {tasks.filter(t => t.status === 'completed').length}/{tasks.length} Complete
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-secondary/30 rounded-lg p-3 border border-border/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm truncate" title={task.requirements.description}>
                    {task.requirements.description}
                  </span>
                  {getStatusIcon(task.status)}
                </div>
                <span className={`text-xs font-mono ${getStatusColor(task.status)}`}>
                  {task.status.toUpperCase()}
                </span>
              </div>

              <div className="text-xs text-muted-foreground mb-2">
                {task.progress.currentStep}
              </div>

              <div className="w-full bg-background/50 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${task.progress.percentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">
                  {Math.round(task.progress.percentage)}%
                </span>
                {task.status !== 'queued' && (
                  <span className="text-xs text-primary font-mono">
                    {task.status === 'completed' ? '✓ Ready' : 'Working...'}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No active build tasks.
          </div>
        )}
      </div>
    </div>
  );
};