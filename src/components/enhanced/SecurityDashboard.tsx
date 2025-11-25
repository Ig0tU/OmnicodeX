import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { useSecurity } from './SecurityProvider';

export const SecurityDashboard: React.FC = () => {
  const { metrics, runSecurityAudit } = useSecurity();
  const [isRunningAudit, setIsRunningAudit] = useState(false);

  const handleRunAudit = async () => {
    setIsRunningAudit(true);
    try {
      await runSecurityAudit();
    } finally {
      setIsRunningAudit(false);
    }
  };

  const getThreatLevelColor = (level: SecurityMetrics['threatLevel']) => {
    switch (level) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-muted-foreground';
    }
  };

  const getThreatLevelIcon = (level: SecurityMetrics['threatLevel']) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-5 h-5" />;
      case 'medium':
        return <Shield className="w-5 h-5" />;
      case 'low':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Lock className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-card/20 rounded-lg border border-border"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Security Dashboard
        </h3>

        <button
          onClick={handleRunAudit}
          disabled={isRunningAudit}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isRunningAudit ? 'Running Audit...' : 'Run Security Audit'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-secondary/20 rounded-lg">
          <div className={`flex items-center gap-2 mb-2 ${getThreatLevelColor(metrics.threatLevel)}`}>
            {getThreatLevelIcon(metrics.threatLevel)}
            <span className="font-medium">Threat Level</span>
          </div>
          <div className={`text-lg font-bold ${getThreatLevelColor(metrics.threatLevel)}`}>
            {metrics.threatLevel.toUpperCase()}
          </div>
        </div>

        <div className="p-4 bg-secondary/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-blue-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Compliance Score</span>
          </div>
          <div className="text-lg font-bold text-blue-400">
            {metrics.complianceScore}%
          </div>
        </div>

        <div className="p-4 bg-secondary/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-green-400">
            <Lock className="w-5 h-5" />
            <span className="font-medium">Auth Strength</span>
          </div>
          <div className="text-lg font-bold text-green-400">
            {metrics.authenticationStrength}%
          </div>
        </div>
      </div>

      {metrics.vulnerabilities.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Active Vulnerabilities</h4>
          <div className="space-y-2">
            {metrics.vulnerabilities.slice(0, 5).map((vuln) => (
              <motion.div
                key={vuln.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border-l-4 ${
                  vuln.type === 'high'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-400'
                    : vuln.type === 'medium'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-medium text-sm">{vuln.title}</h5>
                    <p className="text-xs text-muted-foreground mt-1">{vuln.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    vuln.type === 'high'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : vuln.type === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {vuln.type.toUpperCase()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};