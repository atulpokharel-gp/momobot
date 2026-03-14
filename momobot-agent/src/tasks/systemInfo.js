const si = require('systeminformation');
const os = require('os');

async function getSystemInfo() {
  try {
    const [cpu, mem, disk, network, osData] = await Promise.allSettled([
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.networkInterfaces(),
      si.osInfo()
    ]);

    const cpuData = cpu.status === 'fulfilled' ? cpu.value : {};
    const memData = mem.status === 'fulfilled' ? mem.value : {};
    const diskData = disk.status === 'fulfilled' ? disk.value : [];
    const netData = network.status === 'fulfilled' ? network.value : [];
    const osInfo = osData.status === 'fulfilled' ? osData.value : {};

    const primaryNet = Array.isArray(netData)
      ? netData.find(n => !n.internal && n.ip4) : null;

    return {
      platform: process.platform,
      hostname: os.hostname(),
      ip: primaryNet?.ip4 || null,
      version: require('../../package.json')?.version || '1.0.0',
      osInfo: {
        platform: osInfo.platform || process.platform,
        distro: osInfo.distro || '',
        release: osInfo.release || os.release(),
        arch: osInfo.arch || process.arch,
        kernel: osInfo.kernel || ''
      },
      capabilities: detectCapabilities(),
      cpu: {
        manufacturer: cpuData.manufacturer,
        brand: cpuData.brand,
        cores: cpuData.cores,
        physicalCores: cpuData.physicalCores
      },
      memory: {
        total: memData.total,
        free: memData.free,
        used: memData.used
      },
      disk: diskData.slice(0, 3).map(d => ({
        fs: d.fs,
        size: d.size,
        used: d.used,
        use: d.use
      }))
    };
  } catch (err) {
    return {
      platform: process.platform,
      hostname: os.hostname(),
      ip: null,
      capabilities: detectCapabilities(),
      version: '1.0.0'
    };
  }
}

function detectCapabilities() {
  const caps = ['shell', 'system_info', 'process_list', 'file_read', 'file_write'];

  // Check for screenshot capability
  try {
    require('screenshot-desktop');
    caps.push('screenshot');
  } catch (_) {}

  return caps;
}

async function getCurrentMetrics() {
  const [cpu, mem] = await Promise.all([
    si.currentLoad().catch(() => null),
    si.mem().catch(() => null)
  ]);

  return {
    cpuLoad: cpu?.currentLoad?.toFixed(1) || 0,
    memUsed: mem?.used || 0,
    memTotal: mem?.total || 0,
    uptime: os.uptime(),
    timestamp: Date.now()
  };
}

module.exports = { getSystemInfo, getCurrentMetrics };
