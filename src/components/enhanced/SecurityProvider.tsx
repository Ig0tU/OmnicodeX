import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { errorHandler } from '../../utils/errorHandler';
import { useAppStore } from '../../store';
import DOMPurify from 'dompurify';

// --- ENUMS AND CONSTANTS ---
const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' ws: wss:",
  "frame-ancestors 'none'",
].join('; ');

const ENCRYPTION_KEY_NAME = 'encryptionKey';
const CSRF_TOKEN_HEADER = 'X-CSRF-Token';

enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

enum VulnerabilityType {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// --- TYPE DEFINITIONS ---
interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
}

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

interface SecurityVulnerability {
  id: string;
  type: VulnerabilityType;
  category: 'xss' | 'csrf' | 'injection' | 'auth' | 'data-exposure' | 'insecure-transport';
  title: string;
  description: string;
  remediation: string;
  detectedAt: Date;
  resolved: boolean;
}

interface SecurityMetrics {
  threatLevel: ThreatLevel;
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

// --- CONTEXT AND DEFAULT CONFIG ---
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

// --- HELPER FUNCTIONS ---
const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const constantTimeEquals = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

// --- SECURITY PROVIDER ---
export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SecurityConfig>(defaultConfig);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    threatLevel: ThreatLevel.LOW,
    vulnerabilities: [],
    lastAudit: new Date(),
    encryptionStatus: true,
    authenticationStrength: 85,
    complianceScore: 92,
  });

  const user = useAppStore(state => state.user);
  const addNotification = useAppStore(state => state.addNotification);

  const setupCSP = useCallback(() => {
    if (typeof document !== 'undefined' && config.enableCSP) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = CSP_POLICY;
      document.head.appendChild(meta);
    }
  }, [config.enableCSP]);

  const initializeCSRF = useCallback(() => {
    if (config.enableCSRF) {
      const token = generateSecureToken();
      // In a real app, this would be an HttpOnly cookie
      sessionStorage.setItem('csrf-token', token);
    }
  }, [config.enableCSRF]);

  useEffect(() => {
    setupCSP();
    initializeCSRF();

    const auditInterval = setInterval(() => runSecurityAudit(), 5 * 60 * 1000);
    return () => clearInterval(auditInterval);
  }, [setupCSP, initializeCSRF]);

  const updateConfig = (updates: Partial<SecurityConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const runSecurityAudit = async (): Promise<SecurityVulnerability[]> => {
    const vulnerabilities: SecurityVulnerability[] = [];

    // In a real app, these checks would be more sophisticated.
    // For now, we'll simulate some basic checks.

    // Check for sensitive data in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('token') || key.includes('secret'))) {
        vulnerabilities.push({
          id: `localstorage-${i}`,
          type: VulnerabilityType.HIGH,
          category: 'data-exposure',
          title: 'Sensitive data in localStorage',
          description: `Found potentially sensitive key in localStorage: ${key}`,
          remediation: 'Do not store sensitive data in localStorage. Use HttpOnly cookies or a secure server-side session.',
          detectedAt: new Date(),
          resolved: false,
        });
      }
    }

    // Check for weak password policy
    if (config.passwordPolicy.minLength < 12) {
        vulnerabilities.push({
            id: 'weak-password-policy',
            type: VulnerabilityType.MEDIUM,
            category: 'auth',
            title: 'Weak Password Policy',
            description: `Password policy allows passwords shorter than 12 characters.`,
            remediation: 'Enforce a minimum password length of 12 characters.',
            detectedAt: new Date(),
            resolved: false,
        });
    }

    const complianceScore = 100 - (vulnerabilities.length * 20);
    const authenticationStrength = config.passwordPolicy.minLength >= 12 ? 100 : 50;

    setMetrics(prev => ({
      ...prev,
      vulnerabilities,
      lastAudit: new Date(),
      threatLevel: vulnerabilities.length > 0 ? ThreatLevel.HIGH : ThreatLevel.LOW,
      complianceScore: Math.max(0, complianceScore),
      authenticationStrength,
    }));

    return vulnerabilities;
  };

  const sanitizeInput = (input: string): string => {
    if (!config.enableXSS) return input;
    return DOMPurify.sanitize(input);
  };

  const validateCSRF = (token: string): boolean => {
    if (!config.enableCSRF) return true;
    const storedToken = sessionStorage.getItem('csrf-token');
    return storedToken ? constantTimeEquals(storedToken, token) : false;
  };

  const getEncryptionKey = async (): Promise<CryptoKey> => {
    const secret = import.meta.env.VITE_APP_ENCRYPTION_SECRET;
    if (!secret) {
        throw new Error("Encryption secret is not set.");
    }
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );
    return crypto.subtle.deriveKey(
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
};

  const encryptData = async (data: string): Promise<string> => {
    if (!config.enableEncryption) return data;
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(data)
    );
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    return btoa(String.fromCharCode(...combined));
  };

  const decryptData = async (encryptedData: string): Promise<string> => {
    if (!config.enableEncryption) return encryptedData;
    const key = await getEncryptionKey();
    const combined = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    return new TextDecoder().decode(decryptedData);
  };

  const checkPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    // ... (permission logic)
    return false;
  };

  const value = useMemo(() => ({
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
  }), [config, metrics]);

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
