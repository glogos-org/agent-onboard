'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { SKIPPED_DIRECTORIES } = require('./target-metadata-constants');

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'target';
}

function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest();
}

function hashText(text) {
  return hashBuffer(Buffer.from(text, 'utf8'));
}

function hashFile(file) {
  return hashBuffer(fs.readFileSync(file));
}

function base64Url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function hexPrefix(buffer) {
  return buffer.toString('hex').slice(0, 8);
}

function fileId(buffer) {
  return `ni:///sha-256;${base64Url(buffer)}`;
}

function fileUrn(namespace, relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  return `${namespace}:${slugify(normalized)}-${hexPrefix(hashText(normalized))}`;
}

function walkFiles(root, current = '') {
  const absoluteCurrent = path.join(root, current);
  const entries = fs.readdirSync(absoluteCurrent, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && SKIPPED_DIRECTORIES.includes(entry.name)) continue;
    const relativePath = current ? path.join(current, entry.name) : entry.name;
    if (entry.isDirectory()) {
      files.push(...walkFiles(root, relativePath));
      continue;
    }
    if (entry.isFile()) files.push(toPosix(relativePath));
  }
  return files.sort();
}

function targetNamespace(name) {
  return slugify(name).replace(/-/g, '_') === 'agent_onboard' ? 'agent-onboard' : slugify(name);
}

function normalizeUrnNamespace(value, name) {
  const namespace = typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : `urn:${targetNamespace(name)}:file`;
  const withoutTrailingColon = namespace.replace(/:+$/g, '');
  if (withoutTrailingColon.startsWith('urn:')) return withoutTrailingColon;
  return `urn:${slugify(withoutTrailingColon)}:file`;
}

function namespaceFromFileUrn(fileUrnValue) {
  if (typeof fileUrnValue !== 'string' || !fileUrnValue.startsWith('urn:')) return null;
  const parts = fileUrnValue.split(':');
  if (parts.length < 4) return null;
  return parts.slice(0, -1).join(':');
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string' && item.trim().length > 0).map((item) => toPosix(item.trim()));
}

module.exports = Object.freeze({
  toPosix,
  slugify,
  hashBuffer,
  hashText,
  hashFile,
  base64Url,
  hexPrefix,
  fileId,
  fileUrn,
  walkFiles,
  targetNamespace,
  normalizeUrnNamespace,
  namespaceFromFileUrn,
  normalizeStringArray
});
