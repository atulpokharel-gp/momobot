const logger = require('../logger')

let browserProcess = null
let isOpening = false

async function openBrowser(url = '', browserType = 'default') {
  if (isOpening) {
    throw new Error('Browser already opening')
  }

  isOpening = true
  const platform = process.platform

  try {
    if (browserType === 'headless') {
      return await openHeadlessBrowser(url)
    }

    if (platform === 'win32') {
      return await openWindowsBrowser(url)
    } else if (platform === 'darwin') {
      return await openMacBrowser(url)
    } else {
      return await openLinuxBrowser(url)
    }
  } catch (err) {
    throw new Error(`Failed to open browser: ${err.message}`)
  } finally {
    isOpening = false
  }
}

async function openWindowsBrowser(url) {
  const { execa } = await import('execa')

  // Try different browsers in order of preference
  const browsers = [
    { name: 'msedge', args: [url] },
    { name: 'chrome', args: [url] },
    { name: 'firefox', args: [url] },
    { name: 'iexplore', args: [url] }
  ]

  for (const browser of browsers) {
    try {
      browserProcess = execa(browser.name, browser.args, {
        detached: true,
        stdio: 'ignore'
      })
      
      // Detach from parent process
      if (browserProcess.unref) {
        browserProcess.unref()
      }

      logger.info(`Browser opened on Windows: ${browser.name}`)
      return {
        success: true,
        browser: browser.name,
        url,
        pid: browserProcess.pid
      }
    } catch (_) {
      // Try next browser
      continue
    }
  }

  throw new Error('No browser found on this Windows system')
}

async function openMacBrowser(url) {
  const { execa } = await import('execa')

  const browsers = [
    { app: 'Google Chrome', cmd: 'open' },
    { app: 'Safari', cmd: 'open' },
    { app: 'Firefox', cmd: 'open' }
  ]

  for (const browser of browsers) {
    try {
      await execa('open', ['-a', browser.app, url])
      logger.info(`Browser opened on macOS: ${browser.app}`)
      return {
        success: true,
        browser: browser.app,
        url
      }
    } catch (_) {
      continue
    }
  }

  throw new Error('No browser found on this macOS system')
}

async function openLinuxBrowser(url) {
  const { execa } = await import('execa')

  const browsers = ['google-chrome', 'chromium', 'firefox', 'xdg-open']

  for (const browser of browsers) {
    try {
      browserProcess = execa(browser, [url], {
        detached: true,
        stdio: 'ignore'
      })

      if (browserProcess.unref) {
        browserProcess.unref()
      }

      logger.info(`Browser opened on Linux: ${browser}`)
      return {
        success: true,
        browser,
        url,
        pid: browserProcess.pid
      }
    } catch (_) {
      continue
    }
  }

  throw new Error('No browser found on this Linux system')
}

async function openHeadlessBrowser(url) {
  const { execa } = await import('execa')
  const platform = process.platform

  if (platform === 'win32') {
    try {
      await execa('chrome', ['--headless=new', '--disable-gpu', url])
      return { success: true, url, headless: true }
    } catch (err) {
      throw new Error(`Headless browser failed: ${err.message}`)
    }
  } else {
    try {
      await execa('google-chrome', ['--headless=new', '--no-sandbox', url])
      return { success: true, url, headless: true }
    } catch (err) {
      throw new Error(`Headless browser failed: ${err.message}`)
    }
  }
}

async function playYouTubeVideo(videoId, parameters = {}) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`
  const autoPlay = parameters.autoPlay !== false ? 'autoplay=1' : ''

  // Open browser to YouTube video
  const result = await openBrowser(youtubeUrl, parameters.browserType || 'default')

  return {
    ...result,
    videoId,
    youtubeUrl,
    note: 'YouTube video URL opened in browser. Auto-play depends on browser settings and user interaction.'
  }
}

async function navigateTo(url, parameters = {}) {
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required')
  }

  // Validate URL
  try {
    new URL(url)
  } catch (_) {
    throw new Error(`Invalid URL: ${url}`)
  }

  return await openBrowser(url, parameters.browserType || 'default')
}

async function closeBrowser() {
  if (!browserProcess) {
    return { success: true, message: 'No browser process to close' }
  }

  try {
    if (process.platform === 'win32') {
      const { execa } = await import('execa')
      await execa('taskkill', ['/PID', browserProcess.pid.toString(), '/F'])
    } else {
      process.kill(-browserProcess.pid)
    }

    browserProcess = null
    return { success: true, message: 'Browser closed' }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

module.exports = {
  openBrowser,
  playYouTubeVideo,
  navigateTo,
  closeBrowser
}
