import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Zap } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'system' | 'builder';
  content: string;
  timestamp: Date;
  builderId?: string;
}

interface ChatInterfaceProps {
  onNewRequest: (request: string) => void;
}

export const ChatInterface = ({ onNewRequest }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome to CloudIDE! I\'m your autonomous development orchestrator. Describe what you want to build, and I\'ll deploy specialized AI builders to create it in our cloud environment.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    // Trigger builder deployment
    onNewRequest(inputValue);

    setInputValue('');

    // Simulate system response
    setTimeout(() => {
      const systemResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `Analyzing request: "${inputValue}"\n\nDeploying specialized builders:\n• Frontend Builder - React/TypeScript\n• Backend Builder - Node.js/API\n• Database Builder - Schema Design\n• DevOps Builder - CI/CD Pipeline\n\nBuilders are now active in cloud environments...`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemResponse]);
      setIsProcessing(false);
    }, 1000);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="w-5 h-5" />;
      case 'builder':
        return <Zap className="w-5 h-5 text-primary" />;
      default:
        return <Bot className="w-5 h-5 text-accent" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/20 backdrop-blur-sm border border-border rounded-lg">
      {/* Chat Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-lg">Autonomous Development Chat</h3>
        <p className="text-sm text-muted-foreground">Describe your project and watch AI builders create it</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex items-start gap-3 ${
                message.type === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`p-2 rounded-full ${
                message.type === 'user' 
                  ? 'bg-primary/20' 
                  : message.type === 'builder'
                  ? 'bg-accent/20'
                  : 'bg-secondary/20'
              }`}>
                {getMessageIcon(message.type)}
              </div>
              <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {message.content}
                  </pre>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <Bot className="w-4 h-4" />
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-sm">Analyzing and deploying builders...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe what you want to build..."
            className="flex-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};