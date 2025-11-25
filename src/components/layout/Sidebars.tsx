import React from 'react';
import { motion } from 'framer-motion';
import { FileExplorerEnhanced } from '../enhanced/FileExplorerEnhanced';
import { BuilderPanel } from '../BuilderPanel';
import { ChatInterface } from '../ChatInterface';

interface SidebarsProps {
  activeRequest: string | null;
  selectedFile: string | null;
  onFileSelect: (file: { name: string; content: string }) => void;
  onNewRequest: (request: string) => void;
}

export const LeftSidebar = ({ activeRequest, selectedFile, onFileSelect }: Omit<SidebarsProps, 'onNewRequest'>) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="w-80 border-r border-border/20 bg-card/5 backdrop-blur-sm"
  >
    <div className="h-full flex flex-col">
      <div className="flex-1 p-3">
        <FileExplorerEnhanced
          activeRequest={activeRequest}
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
        />
      </div>
      <div className="h-80 p-3 border-t border-border/20">
        <BuilderPanel />
      </div>
    </div>
  </motion.div>
);

export const RightSidebar = ({ onNewRequest }: Pick<SidebarsProps, 'onNewRequest'>) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-96 border-l border-border/20 bg-card/5 backdrop-blur-sm"
    >
        <div className="h-full p-3">
            <ChatInterface onNewRequest={onNewRequest} />
        </div>
    </motion.div>
);
