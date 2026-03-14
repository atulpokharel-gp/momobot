const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../db/database');
const { body, validationResult } = require('express-validator');
const axios = require('axios');

// Email Models Configuration (Free models by default)
const AVAILABLE_MODELS = {
  gemini: {
    name: 'Google Gemini (Free)',
    provider: 'google',
    apiKey: process.env.GOOGLE_GEMINI_API_KEY,
    model: 'gemini-pro',
    free: true,
    rateLimit: 60, // requests per minute
    description: 'Free tier with 60 RPM limit - perfect for small workloads'
  },
  openai: {
    name: 'OpenAI GPT-3.5 (Paid)',
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo',
    free: false,
    rateLimit: 3500,
    description: 'Pay-as-you-go, $0.50/1M tokens'
  },
  huggingface: {
    name: 'HuggingFace (Free)',
    provider: 'huggingface',
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: 'mistral-7b',
    free: true,
    rateLimit: 1, // 1 request per second
    description: 'Free inference with API key'
  }
};

// Initialize database tables for email workflow
const initEmailWorkflowTables = () => {
  try {
    const db_instance = require('better-sqlite3')(process.env.DATABASE_PATH || './workflow.db');
    
    // Gmail accounts table
    db_instance.exec(`
      CREATE TABLE IF NOT EXISTS gmail_accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        refresh_token TEXT NOT NULL,
        access_token TEXT,
        token_expiry INTEGER,
        is_default INTEGER DEFAULT 0,
        sync_enabled INTEGER DEFAULT 1,
        last_sync INTEGER,
        created_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_gmail_user ON gmail_accounts(user_id);
    `);
    
    // Email messages table
    db_instance.exec(`
      CREATE TABLE IF NOT EXISTS email_messages (
        id TEXT PRIMARY KEY,
        gmail_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        from_email TEXT NOT NULL,
        to_email TEXT NOT NULL,
        subject TEXT,
        body TEXT,
        thread_id TEXT,
        category TEXT,
        priority TEXT,
        ai_summary TEXT,
        suggested_reply TEXT,
        is_important INTEGER DEFAULT 0,
        is_replied INTEGER DEFAULT 0,
        received_at INTEGER,
        processed_at INTEGER,
        created_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_email_user ON email_messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_email_category ON email_messages(category);
      CREATE INDEX IF NOT EXISTS idx_email_priority ON email_messages(priority);
    `);
    
    // Email categories rules table
    db_instance.exec(`
      CREATE TABLE IF NOT EXISTS email_categories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT,
        keywords TEXT,
        ai_model TEXT DEFAULT 'gemini',
        auto_reply INTEGER DEFAULT 0,
        reply_template TEXT,
        created_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_category_user ON email_categories(user_id);
    `);
    
    // Email workflow settings table
    db_instance.exec(`
      CREATE TABLE IF NOT EXISTS email_workflow_settings (
        user_id TEXT PRIMARY KEY,
        ai_model TEXT DEFAULT 'gemini',
        auto_categorize INTEGER DEFAULT 1,
        auto_reply_important INTEGER DEFAULT 0,
        sync_interval INTEGER DEFAULT 300,
        max_emails_per_sync INTEGER DEFAULT 50,
        created_at INTEGER,
        updated_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    
    console.log('✅ Email workflow tables initialized');
  } catch (error) {
    console.warn('⚠️ Email workflow tables may already exist:', error.message);
  }
};

// Initialize on startup
initEmailWorkflowTables();

// ============================================
// 1. GMAIL ACCOUNT MANAGEMENT
// ============================================

// Get user's connected Gmail accounts
router.get('/accounts', authenticate, (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT id, email, is_default, sync_enabled, last_sync, created_at
      FROM gmail_accounts
      WHERE user_id = ?
      ORDER BY is_default DESC, created_at DESC
    `).all(req.user.id);

    res.json({
      accounts: accounts,
      totalAccounts: accounts.length
    });
  } catch (error) {
    console.error('Error fetching Gmail accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Add Gmail account (OAuth callback)
router.post('/accounts/connect', 
  authenticate,
  body('email').isEmail(),
  body('refreshToken').notEmpty(),
  body('accessToken').notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, refreshToken, accessToken, expiryTime } = req.body;
      const accountId = `gmail_${Date.now()}`;

      db.prepare(`
        INSERT INTO gmail_accounts (
          id, user_id, email, refresh_token, access_token, 
          token_expiry, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        accountId,
        req.user.id,
        email,
        refreshToken,
        accessToken,
        expiryTime || Math.floor(Date.now() / 1000) + 3600,
        Math.floor(Date.now() / 1000)
      );

      // Make it default if first account
      const accountCount = db.prepare(`
        SELECT COUNT(*) as count FROM gmail_accounts WHERE user_id = ?
      `).get(req.user.id).count;

      if (accountCount === 1) {
        db.prepare(`
          UPDATE gmail_accounts SET is_default = 1 WHERE id = ?
        `).run(accountId);
      }

      res.json({
        success: true,
        accountId: accountId,
        message: `✅ Gmail account connected: ${email}`
      });
    } catch (error) {
      console.error('Error connecting Gmail account:', error);
      res.status(500).json({ error: 'Failed to connect account' });
    }
  }
);

// Set default Gmail account
router.post('/accounts/:accountId/default', authenticate, (req, res) => {
  try {
    const { accountId } = req.params;

    db.prepare(`
      UPDATE gmail_accounts SET is_default = 0 WHERE user_id = ?
    `).run(req.user.id);

    db.prepare(`
      UPDATE gmail_accounts SET is_default = 1 WHERE id = ? AND user_id = ?
    `).run(accountId, req.user.id);

    res.json({ success: true, message: 'Default account updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update default account' });
  }
});

// Remove Gmail account
router.delete('/accounts/:accountId', authenticate, (req, res) => {
  try {
    const { accountId } = req.params;

    db.prepare(`
      DELETE FROM gmail_accounts WHERE id = ? AND user_id = ?
    `).run(accountId, req.user.id);

    res.json({ success: true, message: 'Account removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove account' });
  }
});

// ============================================
// 2. EMAIL WORKFLOW SETTINGS
// ============================================

// Get workflow settings
router.get('/settings', authenticate, (req, res) => {
  try {
    let settings = db.prepare(`
      SELECT * FROM email_workflow_settings WHERE user_id = ?
    `).get(req.user.id);

    if (!settings) {
      // Create default settings with free model
      db.prepare(`
        INSERT INTO email_workflow_settings (
          user_id, ai_model, auto_categorize, 
          auto_reply_important, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        req.user.id,
        'gemini', // Default to free model
        1, // Enable auto-categorize
        0, // Don't auto-reply by default (safety)
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000)
      );

      settings = db.prepare(`
        SELECT * FROM email_workflow_settings WHERE user_id = ?
      `).get(req.user.id);
    }

    res.json({
      settings: settings,
      availableModels: Object.entries(AVAILABLE_MODELS).map(([key, model]) => ({
        key,
        name: model.name,
        description: model.description,
        free: model.free
      }))
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update workflow settings
router.put('/settings', 
  authenticate,
  body('aiModel').optional().isIn(Object.keys(AVAILABLE_MODELS)),
  body('autoCategorize').optional().isBoolean(),
  body('autoReplyImportant').optional().isBoolean(),
  body('syncInterval').optional().isInt({ min: 60, max: 3600 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { aiModel, autoCategorize, autoReplyImportant, syncInterval } = req.body;

      db.prepare(`
        UPDATE email_workflow_settings
        SET 
          ai_model = COALESCE(?, ai_model),
          auto_categorize = COALESCE(?, auto_categorize),
          auto_reply_important = COALESCE(?, auto_reply_important),
          sync_interval = COALESCE(?, sync_interval),
          updated_at = ?
        WHERE user_id = ?
      `).run(
        aiModel || null,
        autoCategorize !== undefined ? autoCategorize : null,
        autoReplyImportant !== undefined ? autoReplyImportant : null,
        syncInterval || null,
        Math.floor(Date.now() / 1000),
        req.user.id
      );

      res.json({ success: true, message: 'Settings updated' });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
);

// ============================================
// 3. AI CATEGORIZATION
// ============================================

// Categorize email using AI
router.post('/categorize', authenticate, body('subject').notEmpty(), body('body').notEmpty(), async (req, res) => {
  try {
    const { subject, body, fromEmail } = req.body;
    const settings = db.prepare(`
      SELECT ai_model FROM email_workflow_settings WHERE user_id = ?
    `).get(req.user.id);

    const modelKey = settings?.ai_model || 'gemini';
    const model = AVAILABLE_MODELS[modelKey];

    if (!model.apiKey) {
      return res.status(400).json({ 
        error: `${model.name} API key not configured. Please set environment variable.` 
      });
    }

    let categorization = await categorizeEmailWithAI(
      subject,
      body,
      fromEmail,
      model
    );

    res.json({
      category: categorization.category,
      priority: categorization.priority,
      summary: categorization.summary,
      suggestedReply: categorization.suggestedReply,
      confidence: categorization.confidence,
      model: model.name
    });
  } catch (error) {
    console.error('Error categorizing email:', error);
    res.status(500).json({ error: 'Failed to categorize email', details: error.message });
  }
});

// ============================================
// 4. EMAIL MESSAGES
// ============================================

// Get user's emails with filtering
router.get('/emails', authenticate, (req, res) => {
  try {
    const { category, priority, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT * FROM email_messages
      WHERE user_id = ?
    `;
    const params = [req.user.id];

    if (category && category !== 'all') {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (priority && priority !== 'all') {
      query += ` AND priority = ?`;
      params.push(priority);
    }

    query += ` ORDER BY received_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const emails = db.prepare(query).all(...params);

    const countQuery = `
      SELECT COUNT(*) as count FROM email_messages
      WHERE user_id = ?
      ${category && category !== 'all' ? ` AND category = '${category}'` : ''}
      ${priority && priority !== 'all' ? ` AND priority = '${priority}'` : ''}
    `;

    const totalCount = db.prepare(countQuery).get(req.user.id).count;

    // Get category breakdown
    const categoryBreakdown = db.prepare(`
      SELECT category, COUNT(*) as count, 
             SUM(CASE WHEN is_important = 1 THEN 1 ELSE 0 END) as important_count
      FROM email_messages
      WHERE user_id = ?
      GROUP BY category
    `).all(req.user.id);

    res.json({
      emails: emails,
      totalCount: totalCount,
      category_breakdown: categoryBreakdown,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Get single email with full details
router.get('/emails/:emailId', authenticate, (req, res) => {
  try {
    const { emailId } = req.params;

    const email = db.prepare(`
      SELECT * FROM email_messages
      WHERE id = ? AND user_id = ?
    `).get(emailId, req.user.id);

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(email);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

// Store processed email
router.post('/emails', authenticate, body('gmailId').notEmpty(), async (req, res) => {
  try {
    const {
      gmailId,
      fromEmail,
      toEmail,
      subject,
      body,
      threadId,
      receivedAt,
      autoProcess = true
    } = req.body;

    const emailId = `email_${Date.now()}`;
    let category = 'inbox';
    let priority = 'normal';
    let summary = '';
    let suggestedReply = '';
    let isImportant = 0;

    // Auto-categorize if enabled
    if (autoProcess) {
      const settings = db.prepare(`
        SELECT * FROM email_workflow_settings WHERE user_id = ?
      `).get(req.user.id);

      if (settings?.auto_categorize) {
        const modelKey = settings.ai_model || 'gemini';
        const model = AVAILABLE_MODELS[modelKey];

        if (model.apiKey) {
          const categorization = await categorizeEmailWithAI(
            subject,
            body,
            fromEmail,
            model
          );

          category = categorization.category;
          priority = categorization.priority;
          summary = categorization.summary;
          suggestedReply = categorization.suggestedReply;
          isImportant = categorization.priority === 'high' ? 1 : 0;

          // Auto-generate reply for important emails
          if (isImportant && settings.auto_reply_important) {
            suggestedReply = await generateAutoReply(
              subject,
              body,
              fromEmail,
              category,
              model
            );
          }
        }
      }
    }

    db.prepare(`
      INSERT INTO email_messages (
        id, gmail_id, user_id, from_email, to_email,
        subject, body, thread_id, category, priority,
        ai_summary, suggested_reply, is_important,
        received_at, processed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      emailId,
      gmailId,
      req.user.id,
      fromEmail,
      toEmail,
      subject,
      body,
      threadId,
      category,
      priority,
      summary,
      suggestedReply,
      isImportant,
      receivedAt,
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000)
    );

    res.json({
      success: true,
      emailId: emailId,
      category: category,
      priority: priority,
      isImportant: isImportant === 1
    });
  } catch (error) {
    console.error('Error storing email:', error);
    res.status(500).json({ error: 'Failed to store email', details: error.message });
  }
});

// Mark email as replied
router.patch('/emails/:emailId/replied', authenticate, (req, res) => {
  try {
    const { emailId } = req.params;
    const { reply } = req.body;

    db.prepare(`
      UPDATE email_messages
      SET is_replied = 1, suggested_reply = ?
      WHERE id = ? AND user_id = ?
    `).run(reply || null, emailId, req.user.id);

    res.json({ success: true, message: 'Email marked as replied' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function categorizeEmailWithAI(subject, body, fromEmail, model) {
  try {
    const prompt = `Analyze this email and categorize it:

Subject: ${subject}
From: ${fromEmail}
Body: ${body.substring(0, 500)}

Respond in JSON format:
{
  "category": "work|personal|sales|support|newsletter|spam",
  "priority": "high|normal|low",
  "summary": "one line summary",
  "suggestedReply": "brief reply suggestion",
  "confidence": 0.0-1.0
}`;

    if (model.provider === 'google') {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model.model}:generateContent?key=${model.apiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200
          }
        }
      );

      const content = response.data.candidates[0].content.parts[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } else if (model.provider === 'openai') {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: model.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 200
        },
        {
          headers: { 'Authorization': `Bearer ${model.apiKey}` }
        }
      );

      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    // Fallback categorization
    return {
      category: 'inbox',
      priority: 'normal',
      summary: subject,
      suggestedReply: 'Thank you for your email.',
      confidence: 0.5
    };
  } catch (error) {
    console.error('AI categorization error:', error.message);
    return {
      category: 'inbox',
      priority: 'normal',
      summary: subject,
      suggestedReply: '',
      confidence: 0
    };
  }
}

async function generateAutoReply(subject, body, fromEmail, category, model) {
  try {
    const prompt = `Generate a professional auto-reply for this Important email:

Category: ${category}
From: ${fromEmail}
Subject: ${subject}

Keep it brief (2-3 sentences) and mention you'll follow up soon.`;

    if (model.provider === 'google') {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model.model}:generateContent?key=${model.apiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150
          }
        }
      );

      return response.data.candidates[0].content.parts[0].text;
    }

    return 'Thank you for your email. I will get back to you shortly.';
  } catch (error) {
    console.error('Auto-reply generation error:', error.message);
    return '';
  }
}

module.exports = router;
