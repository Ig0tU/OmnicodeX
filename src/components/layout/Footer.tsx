import React from 'react';
import { motion } from 'framer-motion';
import { Database, Shield, Cloud } from 'lucide-react';

const Footer = () => (
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
);

export default Footer;
