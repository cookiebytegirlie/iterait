'use strict';

// AES-256-GCM helpers for encrypting secrets at rest (e.g. stored GitHub tokens).
//
// Format of the blob produced by encrypt(): "iv:tag:ciphertext", where each of
// the three parts is base64-encoded. A fresh random 12-byte IV is used per call.
//
// The 32-byte key is read from process.env.TOKEN_ENC_KEY, accepted as either
// base64 or hex. Validation is LAZY (first use of encrypt/decrypt) so that
// importing this module never throws — keeping it safe to require() in tests.

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_BYTES = 32;

let cachedKey = null;

// Decode TOKEN_ENC_KEY (base64 or hex) into exactly 32 bytes, or throw.
function loadKey() {
  if (cachedKey) return cachedKey;

  const raw = process.env.TOKEN_ENC_KEY;
  if (!raw || !raw.trim()) {
    throw new Error(
      'TOKEN_ENC_KEY is not set. Provide a 32-byte key encoded as base64 or hex.'
    );
  }

  const value = raw.trim();
  let key = null;

  // Try hex first when the string looks like clean hex of the right length.
  if (/^[0-9a-fA-F]+$/.test(value) && value.length === KEY_BYTES * 2) {
    key = Buffer.from(value, 'hex');
  } else {
    // Fall back to base64 (also handles base64url-ish input).
    const b64 = Buffer.from(value, 'base64');
    if (b64.length === KEY_BYTES) {
      key = b64;
    } else {
      // Last resort: maybe it was hex of an unexpected length — try that too.
      if (/^[0-9a-fA-F]+$/.test(value)) {
        const hex = Buffer.from(value, 'hex');
        if (hex.length === KEY_BYTES) key = hex;
      }
    }
  }

  if (!key || key.length !== KEY_BYTES) {
    throw new Error(
      `TOKEN_ENC_KEY must decode to exactly ${KEY_BYTES} bytes (as base64 or hex).`
    );
  }

  cachedKey = key;
  return cachedKey;
}

// Encrypt a UTF-8 plaintext string. Returns "iv:tag:ciphertext" (all base64).
function encrypt(plaintext) {
  if (typeof plaintext !== 'string') {
    throw new TypeError('encrypt() expects a string plaintext.');
  }

  const key = loadKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    tag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':');
}

// Decrypt an "iv:tag:ciphertext" blob. Verifies the GCM auth tag. Returns UTF-8.
function decrypt(blob) {
  if (typeof blob !== 'string') {
    throw new TypeError('decrypt() expects a string blob.');
  }

  const parts = blob.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed ciphertext: expected "iv:tag:ciphertext".');
  }

  const key = loadKey();
  const iv = Buffer.from(parts[0], 'base64');
  const tag = Buffer.from(parts[1], 'base64');
  const ciphertext = Buffer.from(parts[2], 'base64');

  if (iv.length !== IV_BYTES) {
    throw new Error('Malformed ciphertext: invalid IV length.');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  // .final() throws if the auth tag does not verify.
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}

module.exports = { encrypt, decrypt };
