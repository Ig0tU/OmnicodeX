import React from 'react';
import { motion } from 'framer-motion';
import { CodeEditor } from '../CodeEditor';
import { Terminal } from '../Terminal';
import { useActiveTasks } from '../../store';
import { Zap } from 'lucide-react';

interface MainPanelProps {
  activeRequest: string | null;
}

const TaskProgressOverlay = () => {
    const tasks = useActiveTasks();
    const inProgressTask = tasks.find(t => t.status === 'in-progress');

    if (!inProgressTask) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-3 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10"
      >
        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Zap className="w-6 h-6 animate-pulse" />
          <span>AI Builder is writing code...</span>
        </div>
        <div className="w-1/2 mt-4 bg-border rounded-full h-2.5">
          <motion.div
            className="bg-primary h-2.5 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${inProgressTask.progress.percentage}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {Math.round(inProgressTask.progress.percentage)}% complete
        </p>
      </motion.div>
    );
  };

export const MainPanel = ({ activeRequest }: MainPanelProps) => {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col"
    >
      <div className="flex-1 p-3 relative">
        <CodeEditor activeRequest={activeRequest} />
        <TaskProgressOverlay />
      </div>
      <div className="h-64 p-3 border-t border-border/20">
        <Terminal activeRequest={activeRequest} />
      </div>
    </motion.div>
  );
};
