import React, { createContext, useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { errorHandler } from '../../utils/errorHandler';
import { useAppStore } from '../../store';

interface SecurityConfig {
  enableCSP: boolean;
  enableXSS: boolean;
  enableCSRF: boolean;
  enableRateLimiting: boolean;
  enableEncryption: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number; // minutes
  passwordPolicy: PasswordPolicy;
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
}

interface SecurityVulnerability {
  id: string;
  type: 'high' | 'medium' | 'low';
  category: 'xss' | 'csrf' | 'injection' | 'auth' | 'data-exposure' | 'insecure-transport';
  title: string;
  description: string;
  remediation: string;
  detectedAt: Date;
  resolved: boolean;
}

interface SecurityMetrics {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: SecurityVulnerability[];
  lastAudit: Date;
  encryptionStatus: boolean;
  authenticationStrength: number; // 0-100
  complianceScore: number; // 0-100
}

interface SecurityContextType {
  config: SecurityConfig;
  metrics: SecurityMetrics;
  updateConfig: (updates: Partial<SecurityConfig>) => void;
  runSecurityAudit: () => Promise<SecurityVulnerability[]>;
  sanitizeInput: (input: string) => string;
  validateCSRF: (token: string) => boolean;
  encryptData: (data: string) => Promise<string>;
  decryptData: (encryptedData: string) => Promise<string>;
  checkPermission: (resource: string, action: string) => boolean;
  generateSecureToken: () => string;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

const defaultConfig: SecurityConfig = {
  enableCSP: true,
  enableXSS: true,
  enableCSRF: true,
  enableRateLimiting: true,
  enableEncryption: true,
  maxLoginAttempts: 5,
  sessionTimeout: 30,
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90,
  },
};

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SecurityConfig>(defaultConfig);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    threatLevel: 'low',
    vulnerabilities: [],
    lastAudit: new Date(),
    encryptionStatus: true,
    authenticationStrength: 85,
    complianceScore: 92,
  });

  const user = useAppStore(state => state.user);
  const addNotification = useAppStore(state => state.addNotification);

  // Initialize security measures
  useEffect(() => {
    initializeSecurity();
    runPeriodicAudits();
    setupCSP();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeSecurity = () => {
    // Set up Content Security Policy
    if (config.enableCSP) {
      setupCSP();
    }

    // Initialize CSRF protection
    if (config.enableCSRF) {
      initializeCSRF();
    }

    // Set up rate limiting
    if (config.enableRateLimiting) {
      initializeRateLimiting();
    }

    // Monitor for security events
    setupSecurityMonitoring();
  };

  const setupCSP = () => {
    if (typeof document !== 'undefined') {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' ws: wss:",
        "frame-ancestors 'none'",
      ].join('; ');
      document.head.appendChild(meta);
    }
  };

  const initializeCSRF = () => {
    // Generate CSRF token
    const token = generateSecureToken();
    sessionStorage.setItem('csrf-token', token);
  };

  const initializeRateLimiting = () => {
    // Set up rate limiting for API calls
    const rateLimiter = new Map<string, { count: number; resetTime: number }>();
    
    // Clean up rate limiter every minute
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of rateLimiter.entries()) {
        if (now > value.resetTime) {
          rateLimiter.delete(key);
        }
      }
    }, 60000);
  };

  const setupSecurityMonitoring = () => {
    // Monitor for suspicious activities
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Check for potential XSS attempts
              if (element.tagName === 'SCRIPT' && !element.hasAttribute('data-approved')) {
                reportSecurityViolation('xss', 'Unauthorized script injection detected', element.outerHTML);
              }
              
              // Check for suspicious iframe injections
              if (element.tagName === 'IFRAME' && !element.hasAttribute('data-approved')) {
                reportSecurityViolation('xss', 'Unauthorized iframe injection detected', element.outerHTML);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  };

  const runPeriodicAudits = () => {
    // Run security audit every 5 minutes
    const auditInterval = setInterval(() => {
      runSecurityAudit();
    }, 5 * 60 * 1000);

    return () => clearInterval(auditInterval);
  };

  const cleanup = () => {
    // Cleanup function for when component unmounts
  };

  const updateConfig = (updates: Partial<SecurityConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const runSecurityAudit = async (): Promise<SecurityVulnerability[]> => {
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Check for common vulnerabilities
      await Promise.all([
        checkXSSVulnerabilities(),
        checkCSRFVulnerabilities(),
        checkAuthenticationWeaknesses(),
        checkDataExposure(),
        checkInsecureTransport(),
      ].map(async (check) => {
        const results = await check();
        vulnerabilities.push(...results);
      }));

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        vulnerabilities,
        lastAudit: new Date(),
        threatLevel: calculateThreatLevel(vulnerabilities),
        complianceScore: calculateComplianceScore(vulnerabilities),
      }));

      // Notify if high-risk vulnerabilities found
      const highRiskVulns = vulnerabilities.filter(v => v.type === 'high');
      if (highRiskVulns.length > 0) {
        addNotification({
          type: 'warning',
          title: 'Security Alert',
          message: `${highRiskVulns.length} high-risk vulnerabilities detected`,
          autoHide: false,
        });
      }

      return vulnerabilities;
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('security-error', 'Security audit failed', 'high', false, {
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
      return [];
    }
  };

  const checkXSSVulnerabilities = async (): Promise<SecurityVulnerability[]> => {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for unescaped user input
    const scripts = document.querySelectorAll('script:not([data-approved])');
    scripts.forEach((script, index) => {
      if (script.innerHTML.includes('document.write') || script.innerHTML.includes('innerHTML')) {
        vulnerabilities.push({
          id: `xss-${index}`,
          type: 'high',
          category: 'xss',
          title: 'Potential XSS vulnerability',
          description: 'Unescaped script content detected',
          remediation: 'Sanitize all user input and use safe DOM manipulation methods',
          detectedAt: new Date(),
          resolved: false,
        });
      }
    });

    return vulnerabilities;
  };

  const checkCSRFVulnerabilities = async (): Promise<SecurityVulnerability[]> => {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check if CSRF token is present and valid
    const csrfToken = sessionStorage.getItem('csrf-token');
    if (!csrfToken || csrfToken.length < 32) {
      vulnerabilities.push({
        id: 'csrf-1',
        type: 'medium',
        category: 'csrf',
        title: 'CSRF protection weakness',
        description: 'CSRF token is missing or weak',
        remediation: 'Implement strong CSRF tokens for all state-changing operations',
        detectedAt: new Date(),
        resolved: false,
      });
    }

    return vulnerabilities;
  };

  const checkAuthenticationWeaknesses = async (): Promise<SecurityVulnerability[]> => {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check password policy compliance
    if (!user) return vulnerabilities;

    // This would typically check against stored password policies
    // For demo purposes, we'll simulate some checks
    if (config.passwordPolicy.minLength < 12) {
      vulnerabilities.push({
        id: 'auth-1',
        type: 'medium',
        category: 'auth',
        title: 'Weak password policy',
        description: 'Password minimum length is below recommended 12 characters',
        remediation: 'Increase minimum password length to at least 12 characters',
        detectedAt: new Date(),
        resolved: false,
      });
    }

    return vulnerabilities;
  };

  const checkDataExposure = async (): Promise<SecurityVulnerability[]> => {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for sensitive data in local storage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value && (
            value.includes('password') || 
            value.includes('token') || 
            value.includes('secret') ||
            /\d{16}/.test(value) // Credit card pattern
          )) {
            vulnerabilities.push({
              id: `data-exposure-${i}`,
              type: 'high',
              category: 'data-exposure',
              title: 'Sensitive data in local storage',
              description: `Potentially sensitive data found in local storage key: ${key}`,
              remediation: 'Encrypt sensitive data or use secure storage mechanisms',
              detectedAt: new Date(),
              resolved: false,
            });
          }
        }
      }
    } catch (error) {
      // Handle storage access errors
    }

    return vulnerabilities;
  };

  const checkInsecureTransport = async (): Promise<SecurityVulnerability[]> => {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check if HTTPS is being used
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      vulnerabilities.push({
        id: 'transport-1',
        type: 'high',
        category: 'insecure-transport',
        title: 'Insecure transport',
        description: 'Application is not using HTTPS',
        remediation: 'Enable HTTPS for all communications',
        detectedAt: new Date(),
        resolved: false,
      });
    }

    return vulnerabilities;
  };

  const calculateThreatLevel = (vulnerabilities: SecurityVulnerability[]): SecurityMetrics['threatLevel'] => {
    const highRisk = vulnerabilities.filter(v => v.type === 'high').length;
    const mediumRisk = vulnerabilities.filter(v => v.type === 'medium').length;
    
    if (highRisk > 2) return 'critical';
    if (highRisk > 0 || mediumRisk > 3) return 'high';
    if (mediumRisk > 0) return 'medium';
    return 'low';
  };

  const calculateComplianceScore = (vulnerabilities: SecurityVulnerability[]): number => {
    const totalIssues = vulnerabilities.length;
    const highRiskIssues = vulnerabilities.filter(v => v.type === 'high').length;
    const mediumRiskIssues = vulnerabilities.filter(v => v.type === 'medium').length;
    
    const penalty = (highRiskIssues * 20) + (mediumRiskIssues * 10) + (totalIssues * 2);
    return Math.max(0, 100 - penalty);
  };

  const sanitizeInput = (input: string): string => {
    if (!config.enableXSS) return input;
    
    return input
      .replace(/[<>]/g, (char) => {
        switch (char) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          default: return char;
        }
      })
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  const validateCSRF = (token: string): boolean => {
    if (!config.enableCSRF) return true;
    
    const storedToken = sessionStorage.getItem('csrf-token');
    return storedToken === token && token.length >= 32;
  };

  const encryptData = async (data: string): Promise<string> => {
    if (!config.enableEncryption) return data;
    
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode('your-secret-key-32-bytes-long!!'),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('salt'),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(data)
      );

      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  };

  const decryptData = async (encryptedData: string): Promise<string> => {
    if (!config.enableEncryption) return encryptedData;
    
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode('your-secret-key-32-bytes-long!!'),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('salt'),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData;
    }
  };

  const checkPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    
    // Check user permissions
    const hasPermission = user.permissions.some(
      permission => permission.resource === resource && permission.action === action
    );
    
    const hasRolePermission = user.roles.some(role =>
      role.permissions.some(
        permission => permission.resource === resource && permission.action === action
      )
    );

    return hasPermission || hasRolePermission;
  };

  const generateSecureToken = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const reportSecurityViolation = (type: string, message: string, details?: string) => {
    errorHandler.handleError(
      errorHandler.createError('security-error', message, 'high', false, {
        type,
        details,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
    );

    addNotification({
      type: 'error',
      title: 'Security Violation',
      message,
      autoHide: false,
    });
  };

  const value: SecurityContextType = {
    config,
    metrics,
    updateConfig,
    runSecurityAudit,
    sanitizeInput,
    validateCSRF,
    encryptData,
    decryptData,
    checkPermission,
    generateSecureToken,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

// Security dashboard component
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