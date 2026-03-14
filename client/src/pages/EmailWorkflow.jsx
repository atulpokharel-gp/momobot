import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import '../styles/EmailWorkflow.css';

const EmailWorkflow = () => {
  const [view, setView] = useState('inbox'); // inbox, accounts, settings
  const [emails, setEmails] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ category: 'all', priority: 'all' });
  const [stats, setStats] = useState({
    totalEmails: 0,
    byCategory: {},
    byPriority: {}
  });

  // Load emails
  useEffect(() => {
    if (view === 'inbox') {
      loadEmails();
    }
  }, [view, filter]);

  // Load accounts
  useEffect(() => {
    if (view === 'accounts') {
      loadAccounts();
    }
  }, [view]);

  // Load settings
  useEffect(() => {
    if (view === 'settings') {
      loadSettings();
    }
  }, [view]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const response = await api.get('/email-workflow/emails', {
        params: {
          category: filter.category,
          priority: filter.priority,
          limit: 50
        }
      });

      setEmails(response.data.emails || []);
      setStats({
        totalEmails: response.data.totalCount || 0,
        byCategory: response.data.category_breakdown || {}
      });
    } catch (error) {
      console.error('Error loading emails:', error);
      toast.error('Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/email-workflow/accounts');
      setAccounts(response.data.accounts || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load Gmail accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/email-workflow/settings');
      setSettings(response.data.settings);
      setAvailableModels(response.data.availableModels || []);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const connectGmailAccount = async () => {
    // This would redirect to Gmail OAuth flow
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/oauth/gmail/callback`;
    const scope = 'https://www.googleapis.com/auth/gmail.readonly';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}`;

    window.location.href = authUrl;
  };

  const setDefaultAccount = async (accountId) => {
    try {
      await api.post(`/email-workflow/accounts/${accountId}/default`);
      toast.success('Default account updated');
      loadAccounts();
    } catch (error) {
      toast.error('Failed to set default account');
    }
  };

  const removeAccount = async (accountId) => {
    if (window.confirm('Remove this Gmail account?')) {
      try {
        await api.delete(`/email-workflow/accounts/${accountId}`);
        toast.success('Account removed');
        loadAccounts();
      } catch (error) {
        toast.error('Failed to remove account');
      }
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      await api.put('/email-workflow/settings', newSettings);
      toast.success('Settings updated');
      loadSettings();
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const markAsReplied = async (emailId, reply) => {
    try {
      await api.patch(`/email-workflow/emails/${emailId}/replied`, { reply });
      toast.success('✅ Reply recorded');
      loadEmails();
    } catch (error) {
      toast.error('Failed to record reply');
    }
  };

  // ====== INBOX VIEW ======
  if (view === 'inbox') {
    return (
      <div className="email-workflow">
        <div className="email-header">
          <h1>📧 Email Workflow Manager</h1>
          <p>AI-powered email categorization, prioritization, and auto-replies</p>
        </div>

        <div className="email-container">
          <div className="email-sidebar">
            <div className="sidebar-section">
              <h3>Views</h3>
              <button
                className={`sidebar-btn ${view === 'inbox' ? 'active' : ''}`}
                onClick={() => setView('inbox')}
              >
                📧 Inbox
              </button>
              <button
                className={`sidebar-btn ${view === 'accounts' ? 'active' : ''}`}
                onClick={() => setView('accounts')}
              >
                🔑 Gmail Accounts
              </button>
              <button
                className={`sidebar-btn ${view === 'settings' ? 'active' : ''}`}
                onClick={() => setView('settings')}
              >
                ⚙️ Settings
              </button>
            </div>

            <div className="sidebar-section">
              <h3>Stats</h3>
              <div className="stat-card">
                <div className="stat-value">{stats.totalEmails}</div>
                <div className="stat-label">Total Emails</div>
              </div>
            </div>

            <div className="sidebar-section">
              <h3>Categories</h3>
              <div className="filter-group">
                {['all', 'work', 'personal', 'sales', 'support', 'newsletter', 'spam'].map(cat => (
                  <button
                    key={cat}
                    className={`filter-btn ${filter.category === cat ? 'active' : ''}`}
                    onClick={() => setFilter({ ...filter, category: cat })}
                  >
                    {cat === 'all' ? '📬 All' : cat}
                    {stats.byCategory[cat] && ` (${stats.byCategory[cat].count})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-section">
              <h3>Priority</h3>
              <div className="filter-group">
                {['all', 'high', 'normal', 'low'].map(pri => (
                  <button
                    key={pri}
                    className={`filter-btn priority-${pri} ${filter.priority === pri ? 'active' : ''}`}
                    onClick={() => setFilter({ ...filter, priority: pri })}
                  >
                    {pri === 'high' && '🔴'} {pri === 'normal' && '🟡'} {pri === 'low' && '🟢'}
                    {pri}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="email-main">
            {loading ? (
              <div className="loading">⏳ Loading emails...</div>
            ) : emails.length === 0 ? (
              <div className="empty-state">
                <p>📭 No emails found</p>
                <p>Connect a Gmail account and sync to see emails</p>
              </div>
            ) : (
              <div className="email-list">
                {emails.map(email => (
                  <div
                    key={email.id}
                    className={`email-item ${selectedEmail?.id === email.id ? 'selected' : ''} priority-${email.priority}`}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="email-item-header">
                      <div className="email-from">
                        <span className="from-name">{email.from_email.split('@')[0]}</span>
                        <span className="from-email">{email.from_email}</span>
                      </div>
                      <div className="email-badges">
                        {email.is_important && <span className="badge badge-important">⭐ Important</span>}
                        <span className={`badge badge-category badge-${email.category}`}>
                          {email.category}
                        </span>
                        <span className={`badge badge-priority badge-${email.priority}`}>
                          {email.priority}
                        </span>
                      </div>
                    </div>
                    <div className="email-subject">{email.subject}</div>
                    {email.ai_summary && (
                      <div className="email-summary">
                        🤖 {email.ai_summary}
                      </div>
                    )}
                    <div className="email-meta">
                      <span className="email-time">
                        {new Date(email.received_at * 1000).toLocaleDateString()}
                      </span>
                      {email.is_replied && <span className="badge-replied">✓ Replied</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedEmail && (
            <div className="email-detail">
              <div className="detail-header">
                <button className="close-btn" onClick={() => setSelectedEmail(null)}>✕</button>
                <h3>{selectedEmail.subject}</h3>
              </div>

              <div className="detail-info">
                <div className="info-row">
                  <span className="label">From:</span>
                  <span>{selectedEmail.from_email}</span>
                </div>
                <div className="info-row">
                  <span className="label">To:</span>
                  <span>{selectedEmail.to_email}</span>
                </div>
                <div className="info-row">
                  <span className="label">Category:</span>
                  <span className={`badge badge-${selectedEmail.category}`}>
                    {selectedEmail.category}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Priority:</span>
                  <span className={`badge badge-${selectedEmail.priority}`}>
                    {selectedEmail.priority}
                  </span>
                </div>
              </div>

              <div className="detail-body">
                <h4>📄 Message</h4>
                <p>{selectedEmail.body}</p>
              </div>

              {selectedEmail.ai_summary && (
                <div className="detail-section">
                  <h4>🤖 AI Summary</h4>
                  <p>{selectedEmail.ai_summary}</p>
                </div>
              )}

              {selectedEmail.suggested_reply && (
                <div className="detail-section">
                  <h4>💬 Suggested Reply</h4>
                  <div className="reply-box">
                    <textarea
                      value={selectedEmail.suggested_reply}
                      readOnly
                      rows="4"
                    />
                    <div className="reply-actions">
                      <button
                        className="btn-primary"
                        onClick={() => {
                          // Copy to clipboard
                          navigator.clipboard.writeText(selectedEmail.suggested_reply);
                          toast.success('✓ Copied to clipboard');
                        }}
                      >
                        📋 Copy Reply
                      </button>
                      <button
                        className="btn-success"
                        onClick={() => markAsReplied(selectedEmail.id, selectedEmail.suggested_reply)}
                      >
                        ✓ Mark as Replied
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ====== GMAIL ACCOUNTS VIEW ======
  if (view === 'accounts') {
    return (
      <div className="email-workflow">
        <div className="email-header">
          <h1>🔑 Gmail Accounts</h1>
          <p>Connect and manage multiple Gmail accounts</p>
        </div>

        <div className="settings-container">
          <button
            className="btn-primary"
            onClick={connectGmailAccount}
            style={{ marginBottom: '24px' }}
          >
            + Connect Gmail Account
          </button>

          {loading ? (
            <div className="loading">⏳ Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div className="empty-state">
              <p>📭 No Gmail accounts connected</p>
              <p>Click the button above to add your first Gmail account</p>
            </div>
          ) : (
            <div className="accounts-grid">
              {accounts.map(account => (
                <div key={account.id} className={`account-card ${account.is_default ? 'default' : ''}`}>
                  <div className="account-header">
                    <h3>📧 {account.email}</h3>
                    {account.is_default && <span className="badge-default">Default</span>}
                  </div>

                  <div className="account-info">
                    <div className="info-item">
                      <span className="label">Status:</span>
                      <span className={account.sync_enabled ? 'status-active' : 'status-inactive'}>
                        {account.sync_enabled ? '✓ Active' : '⊘ Inactive'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Last Sync:</span>
                      <span>
                        {account.last_sync
                          ? new Date(account.last_sync * 1000).toLocaleString()
                          : 'Never'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Added:</span>
                      <span>{new Date(account.created_at * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="account-actions">
                    {!account.is_default && (
                      <button
                        className="btn-secondary"
                        onClick={() => setDefaultAccount(account.id)}
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      className="btn-danger"
                      onClick={() => removeAccount(account.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="info-box" style={{ marginTop: '32px' }}>
            <h4>📌 How it works</h4>
            <ul>
              <li>✓ Connect multiple Gmail accounts securely</li>
              <li>✓ Agent monitors all accounts for new emails</li>
              <li>✓ Each email is automatically categorized with AI</li>
              <li>✓ Priority is assigned based on content & sender</li>
              <li>✓ Important emails get suggested replies</li>
              <li>✓ Set one account as default for syncing</li>
            </ul>
          </div>
        </div>

        <button
          className="btn-secondary"
          onClick={() => setView('inbox')}
          style={{ marginTop: '24px' }}
        >
          ← Back to Inbox
        </button>
      </div>
    );
  }

  // ====== SETTINGS VIEW ======
  if (view === 'settings') {
    return (
      <div className="email-workflow">
        <div className="email-header">
          <h1>⚙️ Email Workflow Settings</h1>
          <p>Configure AI model, auto-categorization, and reply generation</p>
        </div>

        {settings && (
          <div className="settings-container">
            <div className="settings-section">
              <h3>AI Model (Default: Free)</h3>
              <p className="section-description">
                Choose which AI model to use for email categorization and reply generation.
                Free models are recommended for cost-effective operation.
              </p>

              <div className="model-grid">
                {availableModels.map(model => (
                  <div
                    key={model.key}
                    className={`model-card ${settings.ai_model === model.key ? 'selected' : ''}`}
                    onClick={() => updateSettings({ aiModel: model.key })}
                  >
                    <div className="model-header">
                      <h4>{model.name}</h4>
                      {model.free && <span className="badge badge-free">FREE</span>}
                    </div>
                    <p className="model-description">{model.description}</p>
                    {settings.ai_model === model.key && (
                      <div className="model-selected">✓ Selected</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="settings-section">
              <h3>Auto-Categorization</h3>
              <p className="section-description">
                Automatically categorize incoming emails into categories like Work, Personal, Sales, Support, etc.
              </p>

              <div className="toggle-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.auto_categorize === 1}
                    onChange={(e) =>
                      updateSettings({ autoCategorize: e.target.checked })
                    }
                  />
                  <span>Enable automatic email categorization</span>
                </label>
                <p className="help-text">
                  When enabled, each incoming email will be analyzed and sorted into appropriate categories.
                </p>
              </div>
            </div>

            <div className="settings-section">
              <h3>Auto-Reply for Important Emails</h3>
              <p className="section-description">
                Automatically generate and send replies to important emails. Useful for customer support automation.
              </p>

              <div className="toggle-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.auto_reply_important === 1}
                    onChange={(e) =>
                      updateSettings({ autoReplyImportant: e.target.checked })
                    }
                  />
                  <span>Enable auto-reply for high priority emails</span>
                </label>
                <p className="help-text" style={{ color: '#f59e0b' }}>
                  ⚠️ Be careful with this setting. Always review generated replies before enabling auto-send.
                </p>
              </div>
            </div>

            <div className="settings-section">
              <h3>Sync Settings</h3>
              <p className="section-description">
                Configure how frequently emails are synced and processed.
              </p>

              <div className="input-group">
                <label>Sync Interval (seconds)</label>
                <input
                  type="number"
                  min="60"
                  max="3600"
                  value={settings.sync_interval || 300}
                  onChange={(e) =>
                    updateSettings({ syncInterval: parseInt(e.target.value) })
                  }
                />
                <p className="help-text">
                  How often to check for new emails (60 seconds to 1 hour)
                </p>
              </div>
            </div>

            <div className="info-box">
              <h4>💡 Recommended Setup</h4>
              <ul>
                <li>✓ Use <strong>Gemini</strong> (free tier) for cost-effective operation</li>
                <li>✓ Enable <strong>auto-categorization</strong> for all users</li>
                <li>✓ Start with <strong>manual reply</strong> (auto-reply disabled)</li>
                <li>✓ Review agent logs before enabling auto-reply</li>
                <li>✓ Use 5-10 minute sync intervals for real-time feel</li>
              </ul>
            </div>
          </div>
        )}

        <button
          className="btn-secondary"
          onClick={() => setView('inbox')}
          style={{ marginTop: '24px' }}
        >
          ← Back to Inbox
        </button>
      </div>
    );
  }
};

export default EmailWorkflow;
