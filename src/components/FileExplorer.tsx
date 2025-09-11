import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, File, FolderOpen, Plus, GitBranch, Zap, FileJson, FileCode, FileText, FileImage } from 'lucide-react';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  isExpanded?: boolean;
  isNew?: boolean;
  builderId?: string;
}

interface FileExplorerProps {
  activeRequest: string | null;
  onFileSelect: (file: { name: string; content: string }) => void;
  selectedFile: string | null;
}

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop();
  switch (extension) {
    case 'tsx':
    case 'jsx':
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'html':
      return <FileCode className="w-4 h-4 text-orange-400" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-400" />;
    case 'md':
      return <FileText className="w-4 h-4 text-gray-400" />;
    case 'png':
    case 'jpg':
    case 'svg':
      return <FileImage className="w-4 h-4 text-purple-400" />;
    default:
      return <File className="w-4 h-4 text-muted-foreground" />;
  }
};

export const FileExplorer = ({ activeRequest, onFileSelect, selectedFile }: FileExplorerProps) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([
    {
      id: 'src',
      name: 'src',
      type: 'folder',
      isExpanded: true,
      children: [
        {
          id: 'components',
          name: 'components',
          type: 'folder',
          isExpanded: true,
          children: [
            { id: 'App.tsx', name: 'App.tsx', type: 'file', content: 'export default function App() { return <h1>App</h1> }' },
            { id: 'Header.tsx', name: 'Header.tsx', type: 'file', content: 'export default function Header() { return <header>Header</header> }' }
          ]
        },
        { id: 'pages', name: 'pages', type: 'folder', children: [] },
        { id: 'utils', name: 'utils', type: 'folder', children: [] }
      ]
    },
    {
      id: 'public',
      name: 'public',
      type: 'folder',
      children: [
        { id: 'index.html', name: 'index.html', type: 'file', content: '<html><body></body></html>' }
      ]
    },
    { id: 'package.json', name: 'package.json', type: 'file', content: '{ "name": "my-app" }' },
    { id: 'README.md', name: 'README.md', type: 'file', content: '# My App' }
  ]);

  const [recentFiles, setRecentFiles] = useState<Array<{ name: string, builderId: string, action: string }>>([]);

  useEffect(() => {
    if (activeRequest) {
      // Simulate file creation by builders
      const simulateFileCreation = () => {
        const newFiles = [
          { name: 'UserAuth.tsx', builderId: 'frontend', action: 'created' },
          { name: 'api/users.ts', builderId: 'backend', action: 'created' },
          { name: 'database/schema.sql', builderId: 'backend', action: 'created' },
          { name: 'Dockerfile', builderId: 'devops', action: 'created' },
          { name: 'security/auth.ts', builderId: 'security', action: 'created' },
          { name: 'LoginPage.tsx', builderId: 'frontend', action: 'updated' },
          { name: 'middleware/cors.ts', builderId: 'backend', action: 'created' }
        ];

        newFiles.forEach((file, index) => {
          setTimeout(() => {
            setRecentFiles(prev => [file, ...prev.slice(0, 9)]);
            
            // Add to file tree
            setFileTree(prev => {
              const updated = [...prev];
              if (file.name.includes('/')) {
                // Handle nested files
                const [folder, fileName] = file.name.split('/');
                const findAndUpdate = (nodes: FileNode[]): FileNode[] => {
                  return nodes.map(node => {
                    if (node.name === folder && node.type === 'folder') {
                      return {
                        ...node,
                        children: [
                          ...(node.children || []),
                          { id: file.name, name: fileName, type: 'file', isNew: true, builderId: file.builderId }
                        ]
                      };
                    }
                    if (node.children) {
                      return { ...node, children: findAndUpdate(node.children) };
                    }
                    return node;
                  });
                };
                return findAndUpdate(updated);
              } else {
                // Add to src/components
                const findComponents = (nodes: FileNode[]): FileNode[] => {
                  return nodes.map(node => {
                    if (node.name === 'src' && node.type === 'folder') {
                      return {
                        ...node,
                        children: node.children?.map(child => {
                          if (child.name === 'components') {
                            return {
                              ...child,
                              children: [
                                ...(child.children || []),
                                { id: file.name, name: file.name, type: 'file', isNew: true, builderId: file.builderId }
                              ]
                            };
                          }
                          return child;
                        })
                      };
                    }
                    return node;
                  });
                };
                return findComponents(updated);
              }
            });
          }, index * 2000);
        });
      };

      simulateFileCreation();
    }
  }, [activeRequest]);

  const toggleFolder = (id: string) => {
    const toggleInTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === id && node.type === 'folder') {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children) {
          return { ...node, children: toggleInTree(node.children) };
        }
        return node;
      });
    };
    setFileTree(toggleInTree(fileTree));
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => (
      <motion.div
        key={node.id}
        initial={node.isNew ? { opacity: 0, x: 20 } : {}}
        animate={{ opacity: 1, x: 0 }}
        className={`${depth > 0 ? 'ml-4' : ''}`}
      >
        <div
          className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-secondary/50 ${
            selectedFile === node.name ? 'bg-primary/20' : ''
          } ${
            node.isNew ? 'bg-primary/10 border-l-2 border-primary' : ''
          }`}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.id);
            } else if (node.content) {
              onFileSelect({ name: node.name, content: node.content });
            }
          }}
        >
          {node.type === 'folder' ? (
            node.isExpanded ? (
              <FolderOpen className="w-4 h-4 text-accent" />
            ) : (
              <Folder className="w-4 h-4 text-accent" />
            )
          ) : (
            getFileIcon(node.name)
          )}
          <span className={`text-sm ${node.isNew ? 'text-primary font-medium' : ''}`}>
            {node.name}
          </span>
          {node.isNew && (
            <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
              NEW
            </span>
          )}
        </div>
        {node.type === 'folder' && node.isExpanded && node.children && (
          <div className="ml-2">
            {renderFileTree(node.children, depth + 1)}
          </div>
        )}
      </motion.div>
    ));
  };

  const getBuilderColor = (builderId: string) => {
    switch (builderId) {
      case 'frontend': return 'text-blue-400';
      case 'backend': return 'text-green-400';
      case 'devops': return 'text-purple-400';
      case 'security': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card/20 backdrop-blur-sm border border-border rounded-lg h-full">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-sm">Project Files</h3>
          <Plus className="w-4 h-4 text-muted-foreground ml-auto cursor-pointer hover:text-primary" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {renderFileTree(fileTree)}
        </div>
      </div>

      {recentFiles.length > 0 && (
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium">Recent Builder Activity</span>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            <AnimatePresence>
              {recentFiles.slice(0, 5).map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-xs"
                >
                  <div className={`w-2 h-2 rounded-full ${getBuilderColor(file.builderId)} bg-current`} />
                  <span className="text-muted-foreground">{file.action}</span>
                  <span className="text-foreground font-mono">{file.name}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};