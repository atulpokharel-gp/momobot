const fs = require('fs').promises;
const path = require('path');

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB read limit

async function readFile(filePath, args = {}) {
  // Security: prevent path traversal
  const resolved = path.resolve(filePath);
  const cwd = args.cwd ? path.resolve(args.cwd) : null;

  if (cwd && !resolved.startsWith(cwd)) {
    throw new Error('Path traversal not allowed');
  }

  const stats = await fs.stat(resolved);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (max ${MAX_FILE_SIZE / 1024}KB)`);
  }

  const content = await fs.readFile(resolved, args.encoding || 'utf8');
  return { data: { path: resolved, content, size: stats.size } };
}

async function writeFile(filePath, args = {}) {
  const resolved = path.resolve(filePath);
  const cwd = args.cwd ? path.resolve(args.cwd) : null;

  if (cwd && !resolved.startsWith(cwd)) {
    throw new Error('Path traversal not allowed');
  }

  const { content = '', append = false } = args;

  if (append) {
    await fs.appendFile(resolved, content, args.encoding || 'utf8');
  } else {
    await fs.writeFile(resolved, content, args.encoding || 'utf8');
  }

  return { data: { path: resolved, written: Buffer.byteLength(content), append } };
}

module.exports = { readFile, writeFile };
