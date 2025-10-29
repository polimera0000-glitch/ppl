// src/utils/getepayEncryption.js
const crypto = require('crypto');

function base64ToBytes(base64) {
  return Uint8Array.from(Buffer.from(base64, 'base64'));
}

function bytesToBase64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

class GcmPgEncryption {
  constructor(iv, ivKey) {
    this.iv = iv;
    this.ivKey = ivKey;
    this.mKey = null;
  }

  async init() {
    const combined = this.ivKey + this.iv;
    const combinedBytes = new TextEncoder().encode(combined);
    const hash = crypto.createHash('sha256').update(combinedBytes).digest();
    this.mKey = bytesToBase64(hash);
  }

  async encryptWithMKeys(plainMessage) {
    if (!this.mKey) await this.init();
    
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const passwordBytes = Buffer.from(this.mKey, 'utf-8');
    const derivedKey = crypto.pbkdf2Sync(passwordBytes, salt, 65535, 32, 'sha512');
    
    const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
    const plaintext = Buffer.from(plainMessage, 'utf-8');
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    
    const combined = Buffer.concat([salt, iv, encrypted, tag]);
    return bytesToBase64(combined);
  }

  async decryptWithMKeys(cipherContent) {
    if (!this.mKey) await this.init();
    
    const combined = base64ToBytes(cipherContent);
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28, -16);
    const tag = combined.slice(-16);
    
    const passwordBytes = Buffer.from(this.mKey, 'utf-8');
    const derivedKey = crypto.pbkdf2Sync(passwordBytes, salt, 65535, 32, 'sha512');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf-8');
  }
}

// Getepay specific encryption/decryption functions
class GetepayEncryption {
  constructor() {
    this.key = process.env.PAYMENT_SECRET_KEY;
    this.iv = process.env.PAYMENT_IV;
    this.gcm = new GcmPgEncryption(this.iv, this.key);
  }

  async encrypt(data) {
    const jsonString = JSON.stringify(data);
    return await this.gcm.encryptWithMKeys(jsonString);
  }

  async decrypt(encryptedData) {
    const decryptedString = await this.gcm.decryptWithMKeys(encryptedData);
    return JSON.parse(decryptedString);
  }
}

module.exports = GetepayEncryption;