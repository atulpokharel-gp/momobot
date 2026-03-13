/**
 * Email/Slack Notifications System
 * Sends alerts and notifications for task events via Email and Slack
 */

const nodemailer = require('nodemailer');
const axios = require('axios');

class NotificationService {
  constructor(config = {}) {
    this.config = config;
    this.emailTransporter = null;
    this.slackWebhooks = new Map();
    this.setupEmail();
  }

  /**
   * Setup email transporter
   */
  setupEmail() {
    if (this.config.smtp) {
      this.emailTransporter = nodemailer.createTransport({
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        secure: this.config.smtp.secure,
        auth: {
          user: this.config.smtp.user,
          pass: this.config.smtp.password
        }
      });

      console.log('[Notifications] Email configured');
    }
  }

  /**
   * Register Slack webhook
   */
  registerSlackWebhook(channel, webhookUrl) {
    this.slackWebhooks.set(channel, webhookUrl);
    console.log(`[Notifications] Registered Slack channel: ${channel}`);
  }

  /**
   * Send email notification
   */
  async sendEmail(to, subject, htmlContent, textContent) {
    if (!this.emailTransporter) {
      console.warn('[Notifications] Email not configured');
      return { success: false, error: 'Email not configured' };
    }

    try {
      const result = await this.emailTransporter.sendMail({
        from: this.config.smtp.from,
        to,
        subject,
        html: htmlContent,
        text: textContent
      });

      console.log(`[Notifications] Email sent to ${to}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('[Notifications] Email failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send Slack notification
   */
  async sendSlack(channel, message, attachments = []) {
    const webhookUrl = this.slackWebhooks.get(channel);
    if (!webhookUrl) {
      console.warn(`[Notifications] Slack channel not configured: ${channel}`);
      return { success: false, error: 'Slack channel not configured' };
    }

    try {
      await axios.post(webhookUrl, {
        text: message,
        attachments
      });

      console.log(`[Notifications] Slack message sent to #${channel}`);
      return { success: true };
    } catch (error) {
      console.error(`[Notifications] Slack failed: ${channel}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notify task execution
   */
  async notifyTaskExecution(taskId, deviceId, status, result, recipients) {
    const timestamp = new Date().toISOString();
    const statusEmoji = status === 'success' ? '✅' : '❌';

    // Email notification
    const emailHtml = `
      <h2>Task Execution Report</h2>
      <p><strong>Task ID:</strong> ${taskId}</p>
      <p><strong>Device ID:</strong> ${deviceId}</p>
      <p><strong>Status:</strong> ${statusEmoji} ${status.toUpperCase()}</p>
      <p><strong>Timestamp:</strong> ${timestamp}</p>
      <hr>
      <h3>Result:</h3>
      <pre>${JSON.stringify(result, null, 2)}</pre>
    `;

    const emailText = `
      Task Execution Report
      Task ID: ${taskId}
      Device ID: ${deviceId}
      Status: ${status}
      Timestamp: ${timestamp}
      Result: ${JSON.stringify(result, null, 2)}
    `;

    if (recipients && recipients.email) {
      await this.sendEmail(
        recipients.email,
        `Task ${taskId} - ${status.toUpperCase()}`,
        emailHtml,
        emailText
      );
    }

    // Slack notification
    if (recipients && recipients.slackChannel) {
      await this.sendSlack(
        recipients.slackChannel,
        `${statusEmoji} Task ${taskId} executed on ${deviceId}`,
        [
          {
            color: status === 'success' ? 'good' : 'danger',
            fields: [
              { title: 'Task ID', value: taskId, short: true },
              { title: 'Device ID', value: deviceId, short: true },
              { title: 'Status', value: status.toUpperCase(), short: true },
              { title: 'Timestamp', value: timestamp, short: true },
              { title: 'Result', value: JSON.stringify(result), short: false }
            ]
          }
        ]
      );
    }
  }

  /**
   * Notify offline device
   */
  async notifyDeviceOffline(deviceId, lastSeen, recipients) {
    const message = `Device ${deviceId} has been offline since ${lastSeen}`;

    if (recipients && recipients.slackChannel) {
      await this.sendSlack(
        recipients.slackChannel,
        `:warning: ${message}`,
        [
          {
            color: 'warning',
            fields: [
              { title: 'Device ID', value: deviceId, short: true },
              { title: 'Last Seen', value: lastSeen, short: true }
            ]
          }
        ]
      );
    }

    if (recipients && recipients.email) {
      await this.sendEmail(
        recipients.email,
        `Alert: Device ${deviceId} Offline`,
        `<p>${message}</p>`
      );
    }
  }

  /**
   * Notify task failure with retry info
   */
  async notifyRetryScheduled(taskId, deviceId, nextRetryAt, recipients) {
    const message = `Task ${taskId} failed. Retry scheduled for ${nextRetryAt}`;

    if (recipients && recipients.slackChannel) {
      await this.sendSlack(
        recipients.slackChannel,
        `:repeat: ${message}`,
        [
          {
            color: '#ff9900',
            fields: [
              { title: 'Task ID', value: taskId, short: true },
              { title: 'Device ID', value: deviceId, short: true },
              { title: 'Next Retry', value: nextRetryAt, short: true }
            ]
          }
        ]
      );
    }
  }
}

module.exports = NotificationService;
