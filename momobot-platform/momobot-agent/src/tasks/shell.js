const { execa } = require('execa');
const path = require('path');
const logger = require('../logger');

const ALLOWED_COMMANDS = process.env.ALLOWED_COMMANDS
  ? process.env.ALLOWED_COMMANDS.split(',').map(c => c.trim()).filter(Boolean)
  : [];

function isCommandAllowed(command) {
  if (ALLOWED_COMMANDS.length === 0) return true; // Allow all if not restricted

  const cmd = command.split(' ')[0].toLowerCase();
  return ALLOWED_COMMANDS.some(allowed => cmd === allowed || cmd.endsWith(path.sep + allowed));
}

async function executeShell(command, args = {}, signal) {
  if (!isCommandAllowed(command)) {
    throw new Error(`Command not allowed: ${command.split(' ')[0]}`);
  }

  const cwd = args.cwd || process.env.SHELL_CWD || process.cwd();
  const timeout = args.timeout || parseInt(process.env.DEFAULT_TIMEOUT) || 30000;
  const isWindows = process.platform === 'win32';

  try {
    let proc;

    if (isWindows) {
      // Windows: use PowerShell or cmd
      const shell = args.powershell ? 'powershell' : 'cmd';
      const flag = args.powershell ? '-Command' : '/c';
      proc = execa(shell, [flag, command], {
        cwd,
        timeout,
        cancelSignal: signal,
        all: true,
        stripFinalNewline: false,
        env: { ...process.env }
      });
    } else {
      // Unix: use /bin/sh
      proc = execa('sh', ['-c', command], {
        cwd,
        timeout,
        cancelSignal: signal,
        all: true,
        stripFinalNewline: false,
        env: { ...process.env }
      });
    }

    const result = await proc;

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exitCode ?? 0
    };
  } catch (err) {
    if (err.name === 'AbortError' || err.isCanceled) {
      throw Object.assign(new Error('Task aborted'), { name: 'AbortError' });
    }

    // Process failed but we can still return output
    if (err.exitCode !== undefined) {
      return {
        stdout: err.stdout || '',
        stderr: err.stderr || err.message,
        exitCode: err.exitCode ?? 1
      };
    }

    throw err;
  }
}

module.exports = { executeShell };
