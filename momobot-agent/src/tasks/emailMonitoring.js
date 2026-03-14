/**
 * Email Monitoring Agent Task
 * - Monitors multiple Gmail accounts for new emails
 * - AI categorizes and prioritizes emails
 * - Generates intelligent replies for important emails
 * - Uses free Gemini API by default
 */

const axios = require('axios');
const crypto = require('crypto');

class EmailMonitoringAgent {
  constructor(config = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || 'http://localhost:3001/api',
      gmailApiUrl: 'https://www.googleapis.com/gmail/v1',
      syncInterval: config.syncInterval || 300000, // 5 minutes default
      batchSize: config.batchSize || 10,
      aiModel: config.aiModel || 'gemini',
      ...config
    };

    this.isRunning = false;
    this.syncIntervals = new Map(); // Track sync intervals per user
  }

  /**
   * Start monitoring emails for a user
   */
  async startMonitoring(userId, authToken) {
    if (this.syncIntervals.has(userId)) {
      console.log(`⚠️ Already monitoring emails for user ${userId}`);
      return;
    }

    console.log(`🚀 Starting email monitoring for user ${userId}`);
    const intervalId = setInterval(async () => {
      try {
        await this.syncUserEmails(userId, authToken);
      } catch (error) {
        console.error(`❌ Error syncing emails for user ${userId}:`, error.message);
      }
    }, this.config.syncInterval);

    this.syncIntervals.set(userId, intervalId);

    // Initial sync
    try {
      await this.syncUserEmails(userId, authToken);
    } catch (error) {
      console.error(`❌ Initial sync failed for user ${userId}:`, error.message);
    }
  }

  /**
   * Stop monitoring emails for a user
   */
  stopMonitoring(userId) {
    const intervalId = this.syncIntervals.get(userId);
    if (intervalId) {
      clearInterval(intervalId);
      this.syncIntervals.delete(userId);
      console.log(`⏹️ Stopped monitoring emails for user ${userId}`);
    }
  }

  /**
   * Sync user's connected Gmail accounts
   */
  async syncUserEmails(userId, authToken) {
    try {
      // Get user's Gmail accounts
      const accountsResponse = await axios.get(
        `${this.config.apiBaseUrl}/email-workflow/accounts`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );

      const accounts = accountsResponse.data.accounts || [];
      if (accounts.length === 0) {
        console.log(`📭 No connected Gmail accounts for user ${userId}`);
        return;
      }

      // Get user's settings
      const settingsResponse = await axios.get(
        `${this.config.apiBaseUrl}/email-workflow/settings`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );

      const settings = settingsResponse.data.settings;
      const aiModel = settings?.ai_model || 'gemini';

      console.log(`📧 Syncing ${accounts.length} Gmail accounts (AI Model: ${aiModel})`);

      // Sync each account
      for (const account of accounts) {
        if (!account.sync_enabled) {
          console.log(`⏸️ Sync disabled for ${account.email}`);
          continue;
        }

        try {
          await this.syncGmailAccount(
            userId,
            account,
            authToken,
            aiModel,
            settings
          );
        } catch (error) {
          console.error(`❌ Error syncing ${account.email}:`, error.message);
        }
      }

      console.log(`✅ Sync completed for user ${userId}`);
    } catch (error) {
      console.error(`❌ Error fetching Gmail accounts:`, error.message);
      throw error;
    }
  }

  /**
   * Sync a single Gmail account
   */
  async syncGmailAccount(userId, account, authToken, aiModel, settings) {
    try {
      // Refresh access token if needed
      if (account.token_expiry && account.token_expiry < Math.floor(Date.now() / 1000)) {
        console.log(`🔄 Refreshing expired token for ${account.email}`);
        account.access_token = await this.refreshGmailToken(
          account.refresh_token,
          authToken
        );
      }

      // Get recent emails
      const headers = {
        'Authorization': `Bearer ${account.access_token}`,
      };

      const listResponse = await axios.get(
        `${this.config.gmailApiUrl}/users/me/messages`,
        {
          headers,
          params: {
            q: 'newer_than:7d',
            maxResults: this.config.batchSize,
            labelIds: 'INBOX'
          }
        }
      );

      const messages = listResponse.data.messages || [];
      console.log(`📬 Found ${messages.length} recent emails in ${account.email}`);

      // Process each email
      for (const message of messages) {
        try {
          await this.processEmailMessage(
            userId,
            account.id,
            account.email,
            message.id,
            account.access_token,
            authToken,
            aiModel,
            settings
          );
        } catch (error) {
          console.error(`❌ Error processing message ${message.id}:`, error.message);
        }
      }

      // Update last sync time
      await axios.post(
        `${this.config.apiBaseUrl}/email-workflow/accounts/${account.id}/sync`,
        {},
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      ).catch(() => {}); // Fail silently if endpoint doesn't exist

    } catch (error) {
      console.error(`Error in syncGmailAccount:`, error.message);
      throw error;
    }
  }

  /**
   * Process a single email message
   */
  async processEmailMessage(
    userId,
    accountId,
    accountEmail,
    messageId,
    gmailAccessToken,
    authToken,
    aiModel,
    settings
  ) {
    try {
      // Get full email content
      const response = await axios.get(
        `${this.config.gmailApiUrl}/users/me/messages/${messageId}`,
        {
          headers: { 'Authorization': `Bearer ${gmailAccessToken}` },
          params: { format: 'full' }
        }
      );

      const message = response.data;
      const headers = message.payload.headers;

      // Extract email details
      const fromEmail = (headers.find(h => h.name === 'From')?.value || '').match(/[^\s<>]+@[^\s<>]+/)?.[0] || '';
      const toEmail = (headers.find(h => h.name === 'To')?.value || '').match(/[^\s<>]+@[^\s<>]+/)?.[0] || '';
      const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
      const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();
      const threadId = message.threadId;

      // Extract body
      let body = '';
      if (message.payload.parts) {
        const textPart = message.payload.parts.find(part => part.mimeType === 'text/plain');
        if (textPart && textPart.body.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      } else if (message.payload.body?.data) {
        body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      }

      // Check if email already processed
      const existingEmail = await axios.get(
        `${this.config.apiBaseUrl}/email-workflow/emails?gmail_id=${messageId}`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      ).catch(() => ({ data: { emails: [] } }));

      if (existingEmail.data.emails?.length > 0) {
        console.log(`✓ Email ${messageId} already processed`);
        return;
      }

      console.log(`📨 Processing: "${subject}" from ${fromEmail}`);

      // Store email in database with auto-categorization
      const storeResponse = await axios.post(
        `${this.config.apiBaseUrl}/email-workflow/emails`,
        {
          gmailId: messageId,
          fromEmail,
          toEmail,
          subject,
          body: body.substring(0, 5000), // Limit body to 5000 chars
          threadId,
          receivedAt: Math.floor(new Date(date).getTime() / 1000),
          autoProcess: settings?.auto_categorize !== 0
        },
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );

      const { category, priority, isImportant } = storeResponse.data;
      console.log(`✓ Categorized as: ${category} | Priority: ${priority} ${isImportant ? '⭐' : ''}`);

      return storeResponse.data;
    } catch (error) {
      console.error(`Error processing email:`, error.message);
      // Don't throw - continue processing other emails
    }
  }

  /**
   * Refresh Gmail access token
   */
  async refreshGmailToken(refreshToken, userAuthToken) {
    // This would call a backend endpoint to refresh the token
    // Implementation depends on your OAuth setup
    console.log(`🔄 Would refresh token here`);
    return refreshToken; // Placeholder
  }

  /**
   * Get monitoring stats
   */
  getStats() {
    return {
      monitoringUsers: this.syncIntervals.size,
      activeIntervals: Array.from(this.syncIntervals.entries()).map(([userId, intervalId]) => ({
        userId,
        intervalId
      }))
    };
  }
}

// ============================================
// EMAIL AGENT TASK FOR MOMOBOT
// ============================================

module.exports = {
  name: 'email_monitoring',
  description: 'Monitor Gmail accounts, categorize emails with AI, and generate replies',
  icon: '📧',
  category: 'automation',
  version: '1.0.0',

  /**
   * Initialize the email monitoring task
   */
  async initialize(agent) {
    console.log('🚀 Initializing Email Monitoring Agent');

    // Create agent instance
    agent.emailMonitor = new EmailMonitoringAgent({
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001/api',
      syncInterval: parseInt(process.env.EMAIL_SYNC_INTERVAL || '300000'),
      batchSize: parseInt(process.env.EMAIL_BATCH_SIZE || '10'),
      aiModel: process.env.EMAIL_AI_MODEL || 'gemini'
    });

    // Register socket event handlers
    if (agent.io) {
      agent.io.on('connection', (socket) => {
        socket.on('email:startMonitoring', (data) => {
          const { userId, token } = data;
          agent.emailMonitor.startMonitoring(userId, token);
          socket.emit('email:monitoring_started', { userId });
        });

        socket.on('email:stopMonitoring', (data) => {
          const { userId } = data;
          agent.emailMonitor.stopMonitoring(userId);
          socket.emit('email:monitoring_stopped', { userId });
        });

        socket.on('email:getStats', (data, callback) => {
          const stats = agent.emailMonitor.getStats();
          callback(stats);
        });
      });
    }

    console.log('✅ Email Monitoring Agent initialized');
  },

  /**
   * Execute email monitoring
   */
  async execute(params) {
    const {
      action = 'sync',
      userId,
      token,
      gmailId,
      accountId
    } = params;

    const monitor = new EmailMonitoringAgent({
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001/api'
    });

    switch (action) {
      case 'sync':
        return await monitor.syncUserEmails(userId, token);

      case 'startMonitoring':
        return await monitor.startMonitoring(userId, token);

      case 'stopMonitoring':
        return monitor.stopMonitoring(userId);

      case 'getStats':
        return monitor.getStats();

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  },

  /**
   * Handle webhook for new emails
   */
  async handleWebhook(req, res) {
    try {
      const { action, userId, token, emailData } = req.body;

      const monitor = new EmailMonitoringAgent();

      if (action === 'processEmail') {
        const result = await monitor.processEmailMessage(
          userId,
          emailData.accountId,
          emailData.accountEmail,
          emailData.messageId,
          emailData.gmailAccessToken,
          token,
          emailData.aiModel,
          emailData.settings
        );

        res.json({ success: true, result });
      } else {
        res.status(400).json({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Configuration schema
   */
  config: {
    aiModel: {
      type: 'select',
      label: 'AI Model',
      options: ['gemini', 'openai', 'huggingface'],
      default: 'gemini',
      description: 'Choose which AI model to use (Gemini is free)'
    },
    syncInterval: {
      type: 'number',
      label: 'Sync Interval (ms)',
      min: 60000,
      max: 3600000,
      default: 300000,
      description: 'How often to check for new emails'
    },
    autoCategorize: {
      type: 'boolean',
      label: 'Auto-Categorize Emails',
      default: true,
      description: 'Automatically categorize emails with AI'
    },
    autoReply: {
      type: 'boolean',
      label: 'Auto-Reply (Careful!)',
      default: false,
      description: 'Automatically send replies for important emails'
    }
  }
};
