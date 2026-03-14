async function takeScreenshot() {
  try {
    const screenshot = require('screenshot-desktop');
    const img = await screenshot({ format: 'jpg' });
    const base64 = img.toString('base64');
    return {
      data: {
        image: `data:image/jpeg;base64,${base64}`,
        timestamp: new Date().toISOString()
      }
    };
  } catch (err) {
    throw new Error(`Screenshot failed: ${err.message}`);
  }
}

module.exports = { takeScreenshot };
