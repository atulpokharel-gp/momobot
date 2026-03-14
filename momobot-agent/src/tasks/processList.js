async function getProcessList() {
  try {
    // Dynamic import for ESM module
    const { default: psList } = await import('ps-list');
    const list = await psList();
    return list.slice(0, 100).map(p => ({
      pid: p.pid,
      name: p.name,
      cpu: p.cpu,
      memory: p.memory,
      cmd: p.cmd
    }));
  } catch (err) {
    // Fallback: use system command
    const { executeShell } = require('./shell');
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'tasklist /FO CSV /NH' : 'ps aux --sort=-%cpu | head -30';
    const result = await executeShell(cmd, {});
    return { raw: result.stdout };
  }
}

module.exports = { getProcessList };
