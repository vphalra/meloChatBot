import DOMPurify from 'isomorphic-dompurify';
import SHA256 from 'crypto-js/sha256';
import Hex from 'crypto-js/enc-hex';

// Regular expressions for sensitive data patterns
const SENSITIVE_PATTERNS = {
  ssn: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  creditCard: /\b\d{4}[-. ]?\d{4}[-. ]?\d{4}[-. ]?\d{4}\b/g,
  dob: /\b\d{2}[-/]\d{2}[-/]\d{4}\b/g,
  medicalRecord: /\b(MRN|Medical Record Number):\s*\d+\b/gi,
};

/**
 * Sanitizes user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  // Remove any HTML/script tags
  const cleanInput = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed in input
    ALLOWED_ATTR: [], // No attributes allowed
  });

  // Additional sanitization for SQL injection prevention
  return cleanInput
    .replace(/'/g, "''") // Escape single quotes
    .replace(/\\/g, '\\\\'); // Escape backslashes
}

/**
 * Masks sensitive data patterns in text
 */
export function maskSensitiveData(text: string): string {
  let maskedText = text;

  // Replace each type of sensitive data with appropriate masking
  Object.entries(SENSITIVE_PATTERNS).forEach(([type, pattern]) => {
    maskedText = maskedText.replace(pattern, (match) => {
      switch (type) {
        case 'ssn':
          return 'XXX-XX-XXXX';
        case 'email':
          const [local, domain] = match.split('@');
          return `${local[0]}***@${domain}`;
        case 'phone':
          return 'XXX-XXX-XXXX';
        case 'creditCard':
          return 'XXXX-XXXX-XXXX-XXXX';
        case 'dob':
          return 'XX/XX/XXXX';
        case 'medicalRecord':
          return '[REDACTED]';
        default:
          return '[REDACTED]';
      }
    });
  });

  return maskedText;
}

/**
 * Hashes sensitive data for storage using crypto-js
 */
export function hashSensitiveData(data: string): string {
  const salt = import.meta.env.VITE_HASH_SALT || 'default-salt';
  return SHA256(data + salt).toString(Hex);
}

/**
 * Validates input against security rules
 */
export function validateSecurityRules(input: string): boolean {
  // Check for potential security violations
  const violations = Object.entries(SENSITIVE_PATTERNS)
    .some(([_, pattern]) => pattern.test(input));

  return !violations;
}

/**
 * Audits security-relevant actions
 */
export function auditSecurityAction(
  action: string,
  userId: string,
  details: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const auditLog = {
    timestamp,
    action,
    userId: hashSensitiveData(userId),
    details: JSON.stringify(details),
  };

  // Log to secure audit system
  console.log('Security Audit:', auditLog);
  // In production, this would write to a secure audit log system
}