import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, File, FolderOpen, Plus, GitBranch, Zap, FileJson, FileCode, FileText, FileImage, Search, ChevronDown, ChevronRight } from 'lucide-react';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  isExpanded?: boolean;
}

interface FileExplorerProps {
  activeRequest: string | null;
  onFileSelect: (file: { name:string; content: string }) => void;
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

export const FileExplorerEnhanced = ({ activeRequest, onFileSelect, selectedFile }: FileExplorerProps) => {
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

  const [searchTerm, setSearchTerm] = useState('');
  const [isProjectFilesOpen, setProjectFilesOpen] = useState(true);

  const filteredFileTree = useMemo(() => {
    if (!searchTerm) return fileTree;

    const filter = (nodes: FileNode[]): FileNode[] => {
      return nodes.reduce((acc, node) => {
        if (node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return [...acc, node];
        }
        if (node.children) {
          const filteredChildren = filter(node.children);
          if (filteredChildren.length) {
            return [...acc, { ...node, children: filteredChildren }];
          }
        }
        return acc;
      }, [] as FileNode[]);
    };

    return filter(fileTree);
  }, [searchTerm, fileTree]);


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
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`ml-${depth * 2}`}
      >
        <div
          className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-secondary/50 ${
            selectedFile === node.name ? 'bg-primary/20' : ''
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
          <span className="text-sm">{node.name}</span>
        </div>
        {node.type === 'folder' && node.isExpanded && node.children && (
          <div className="ml-2">
            {renderFileTree(node.children, depth + 1)}
          </div>
        )}
      </motion.div>
    ));
  };

  return (
    <div className="bg-card/20 backdrop-blur-sm border border-border rounded-lg h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files..."
            className="bg-transparent text-sm w-full focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div
          className="flex items-center gap-2 p-2 cursor-pointer"
          onClick={() => setProjectFilesOpen(!isProjectFilesOpen)}
        >
          {isProjectFilesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <h3 className="font-semibold text-sm">Project Files</h3>
        </div>
        <AnimatePresence>
          {isProjectFilesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-2">
                {renderFileTree(filteredFileTree)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
