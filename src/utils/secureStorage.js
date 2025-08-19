// Secure token storage utilities
// This provides better alternatives to localStorage for sensitive data

/**
 * Memory-based token storage (most secure, but tokens lost on page refresh)
 * Use this for maximum security in high-risk environments
 */
class MemoryStorage {
  constructor() {
    this.storage = new Map();
  }

  setItem(key, value) {
    this.storage.set(key, value);
  }

  getItem(key) {
    return this.storage.get(key) || null;
  }

  removeItem(key) {
    this.storage.delete(key);
  }

  clear() {
    this.storage.clear();
  }
}

/**
 * Encrypted localStorage (better than plain localStorage)
 * Note: This is still vulnerable to XSS but adds a layer of protection
 */
class EncryptedStorage {
  constructor(secretKey = 'your-encryption-key') {
    this.secretKey = secretKey;
  }

  // Simple XOR encryption (use a proper crypto library in production)
  encrypt(text) {
    return btoa(text.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ this.secretKey.charCodeAt(i % this.secretKey.length))
    ).join(''));
  }

  decrypt(encryptedText) {
    try {
      const text = atob(encryptedText);
      return text.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ this.secretKey.charCodeAt(i % this.secretKey.length))
      ).join('');
    } catch {
      return null;
    }
  }

  setItem(key, value) {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem(key, this.encrypt(value));
    }
  }

  getItem(key) {
    if (typeof Storage !== 'undefined') {
      const encrypted = localStorage.getItem(key);
      return encrypted ? this.decrypt(encrypted) : null;
    }
    return null;
  }

  removeItem(key) {
    if (typeof Storage !== 'undefined') {
      localStorage.removeItem(key);
    }
  }

  clear() {
    if (typeof Storage !== 'undefined') {
      localStorage.clear();
    }
  }
}

// Storage configuration
const STORAGE_TYPE = process.env.NODE_ENV === 'development' ? 'localStorage' : 'memory';

// Create storage instance based on configuration
let storage;
switch (STORAGE_TYPE) {
  case 'memory':
    storage = new MemoryStorage();
    break;
  case 'encrypted':
    storage = new EncryptedStorage();
    break;
  default:
    storage = typeof Storage !== 'undefined' ? localStorage : new MemoryStorage();
}

export default storage;

// Token-specific utilities
export const tokenStorage = {
  setTokens: (accessToken, refreshToken) => {
    if (accessToken) storage.setItem('token', accessToken);
    if (refreshToken) storage.setItem('refreshToken', refreshToken);
  },

  getToken: () => storage.getItem('token'),
  getRefreshToken: () => storage.getItem('refreshToken'),

  clearTokens: () => {
    storage.removeItem('token');
    storage.removeItem('refreshToken');
  },

  // Check if tokens exist
  hasTokens: () => {
    return !!(storage.getItem('token') && storage.getItem('refreshToken'));
  }
};

/**
 * PRODUCTION RECOMMENDATIONS:
 * 
 * 1. Use httpOnly cookies instead of any client-side storage:
 *    - Immune to XSS attacks
 *    - Automatically sent with requests
 *    - Can be secured with SameSite and Secure flags
 * 
 * 2. If you must use client-side storage:
 *    - Use MemoryStorage for maximum security (tokens lost on refresh)
 *    - Use EncryptedStorage with proper encryption (Web Crypto API)
 *    - Never use plain localStorage for sensitive data
 * 
 * 3. Consider using a service worker for token management:
 *    - Tokens stored in service worker scope
 *    - Not accessible from main thread
 *    - Better protection against XSS
 */
