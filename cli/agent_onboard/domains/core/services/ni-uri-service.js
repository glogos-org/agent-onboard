'use strict';

const crypto = require('crypto');

function base64url(buffer) {
  return Buffer.from(buffer).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sha256Hex(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function niFromHex(algorithm, hexDigest) {
  if (algorithm !== 'sha-256') {
    const error = new Error(`unsupported ni algorithm: ${algorithm}`);
    error.code = 'NI_URI_UNSUPPORTED_ALGORITHM';
    throw error;
  }
  if (typeof hexDigest !== 'string' || !/^[0-9a-f]{64}$/.test(hexDigest)) {
    const error = new Error('sha-256 ni digest must be a lowercase 64-character hex string');
    error.code = 'NI_URI_INVALID_HEX_DIGEST';
    throw error;
  }
  return `ni:///sha-256;${base64url(Buffer.from(hexDigest, 'hex'))}`;
}

function digestBytes(bytes) {
  const hex = sha256Hex(bytes);
  return Object.freeze({
    algorithm: 'sha-256',
    hex,
    file_id: niFromHex('sha-256', hex)
  });
}

function parseNi(uri) {
  if (typeof uri !== 'string') {
    const error = new Error('ni uri must be a string');
    error.code = 'NI_URI_INVALID_INPUT';
    throw error;
  }
  const match = uri.match(/^ni:\/\/\/([^;]+);([A-Za-z0-9_-]+)$/);
  if (!match) {
    const error = new Error('invalid ni uri syntax');
    error.code = 'NI_URI_INVALID_SYNTAX';
    throw error;
  }
  const algorithm = match[1];
  if (algorithm !== 'sha-256') {
    const error = new Error(`unsupported ni algorithm: ${algorithm}`);
    error.code = 'NI_URI_UNSUPPORTED_ALGORITHM';
    throw error;
  }
  const digest = match[2];
  const padded = digest + '='.repeat((4 - (digest.length % 4)) % 4);
  const hex = Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('hex');
  return Object.freeze({ algorithm, digest, hex });
}

function verifyNi(uri, hexDigest) {
  const parsed = parseNi(uri);
  return parsed.algorithm === 'sha-256' && parsed.hex === hexDigest;
}

module.exports = Object.freeze({
  digestBytes,
  niFromHex,
  parseNi,
  verifyNi
});
