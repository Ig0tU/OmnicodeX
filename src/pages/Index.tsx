import React, { useState, useCallback } from 'react';
import Header from '../components/layout/Header';
import { LeftSidebar, RightSidebar } from '../components/layout/Sidebars';
import { MainPanel } from '../components/layout/MainPanel';
import Footer from '../components/layout/Footer';
import { useAppStore } from '../store';

const Index = () => {
  const [activeRequest, setActiveRequest] = useState<string | null>(null);
  const { selectedFile, setFile } = useAppStore(state => ({
      selectedFile: state.ui.selectedFiles[0],
      setFile: state.updateUI,
  }));

  const handleFileSelect = useCallback((file: { name: string; content: string }) => {
    setFile({ selectedFiles: [file.name] });
  }, [setFile]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex flex-1 overflow-hidden">
        <LeftSidebar
          activeRequest={activeRequest}
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
        />
        <MainPanel activeRequest={activeRequest} />
        <RightSidebar onNewRequest={setActiveRequest} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
