const fs = require('fs')
const path = require('path')

const LOG_DIR = process.env.LOG_DIR || './logs'
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
}

class Logger {
  constructor() {
    // Ensure log directory exists
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true })
    }
    this.level = LEVELS[LOG_LEVEL] || LEVELS.info
  }

  log(level, message, data = {}) {
    if (LEVELS[level] > this.level) return

    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}${data && Object.keys(data).length ? ' ' + JSON.stringify(data) : ''}`

    // Console output
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
    console[consoleMethod](logMessage)

    // File output
    try {
      const logFile = path.join(LOG_DIR, `${new Date().toISOString().split('T')[0]}.log`)
      fs.appendFileSync(logFile, logMessage + '\n')
    } catch (err) {
      console.error('Failed to write log file:', err.message)
    }
  }

  error(message, data) { this.log('error', message, data) }
  warn(message, data) { this.log('warn', message, data) }
  info(message, data) { this.log('info', message, data) }
  debug(message, data) { this.log('debug', message, data) }
}

module.exports = new Logger()
