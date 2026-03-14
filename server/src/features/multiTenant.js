/**
 * Multi-Tenant SaaS Mode
 * Enables MomoBot to operate as a multi-tenant platform with isolated organizations
 */

class MultiTenantManager {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a new tenant organization
   */
  createTenant(name, email, subdomain, plan = 'starter') {
    try {
      const tenantId = this.db.prepare(
        `INSERT INTO tenants (name, email, subdomain, plan, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        name,
        email,
        subdomain,
        plan,
        'active',
        new Date().toISOString()
      ).lastInsertRowid;

      // Create default role for tenant admin
      this.db.prepare(
        `INSERT INTO tenant_roles (tenant_id, name, permissions)
         VALUES (?, ?, ?)`
      ).run(
        tenantId,
        'admin',
        JSON.stringify([
          'devices:create',
          'devices:read',
          'devices:update',
          'devices:delete',
          'tasks:create',
          'tasks:execute',
          'settings:manage',
          'users:manage'
        ])
      );

      console.log(`[MultiTenant] Created tenant: ${name} (ID: ${tenantId})`);
      return this.getTenant(tenantId);
    } catch (error) {
      console.error('[MultiTenant] Tenant creation failed:', error);
      throw error;
    }
  }

  /**
   * Get tenant by ID
   */
  getTenant(tenantId) {
    return this.db.prepare(
      `SELECT * FROM tenants WHERE id = ?`
    ).get(tenantId);
  }

  /**
   * Get tenant by subdomain
   */
  getTenantBySubdomain(subdomain) {
    return this.db.prepare(
      `SELECT * FROM tenants WHERE subdomain = ?`
    ).get(subdomain);
  }

  /**
   * Create tenant user
   */
  createTenantUser(tenantId, email, roleId, password) {
    try {
      const userId = this.db.prepare(
        `INSERT INTO tenant_users (tenant_id, email, role_id, password, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        tenantId,
        email,
        roleId,
        password,
        new Date().toISOString()
      ).lastInsertRowid;

      console.log(`[MultiTenant] Created user: ${email} for tenant ${tenantId}`);
      return userId;
    } catch (error) {
      console.error('[MultiTenant] User creation failed:', error);
      throw error;
    }
  }

  /**
   * Get tenant user by email
   */
  getTenantUser(tenantId, email) {
    return this.db.prepare(
      `SELECT * FROM tenant_users WHERE tenant_id = ? AND email = ?`
    ).get(tenantId, email);
  }

  /**
   * Create tenant API key
   */
  createTenantAPIKey(tenantId, name, permissions = []) {
    try {
      const apiKey = this.generateAPIKey();
      const keyId = this.db.prepare(
        `INSERT INTO tenant_api_keys (tenant_id, name, key_hash, permissions, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        tenantId,
        name,
        this.hashKey(apiKey),
        JSON.stringify(permissions),
        new Date().toISOString()
      ).lastInsertRowid;

      console.log(`[MultiTenant] Created API key for tenant ${tenantId}`);
      return { keyId, apiKey }; // Return unhashed key only once
    } catch (error) {
      console.error('[MultiTenant] API key creation failed:', error);
      throw error;
    }
  }

  /**
   * Verify API key
   */
  verifyAPIKey(apiKey) {
    const keyHash = this.hashKey(apiKey);
    const record = this.db.prepare(
      `SELECT tenant_id, permissions FROM tenant_api_keys WHERE key_hash = ?`
    ).get(keyHash);

    return record;
  }

  /**
   * Get tenant usage metrics
   */
  getTenantMetrics(tenantId) {
    const metrics = {
      devices: this.db.prepare(
        `SELECT COUNT(*) as count FROM devices WHERE tenant_id = ?`
      ).get(tenantId).count,
      tasks: this.db.prepare(
        `SELECT COUNT(*) as count FROM tasks WHERE tenant_id = ?`
      ).get(tenantId).count,
      users: this.db.prepare(
        `SELECT COUNT(*) as count FROM tenant_users WHERE tenant_id = ?`
      ).get(tenantId).count,
      executedTasks: this.db.prepare(
        `SELECT COUNT(*) as count FROM task_runs 
         WHERE task_id IN (SELECT id FROM tasks WHERE tenant_id = ?)`
      ).get(tenantId).count
    };

    // Check plan limits
    const tenant = this.getTenant(tenantId);
    const limits = this.getPlanLimits(tenant.plan);

    return {
      metrics,
      limits,
      usage: {
        devices: `${metrics.devices}/${limits.maxDevices}`,
        tasks: `${metrics.tasks}/${limits.maxTasks}`,
        users: `${metrics.users}/${limits.maxUsers}`
      }
    };
  }

  /**
   * Get plan limitations
   */
  getPlanLimits(plan) {
    const plans = {
      starter: {
        maxDevices: 5,
        maxTasks: 50,
        maxUsers: 3,
        maxWorkflows: 5,
        features: ['basic_scheduling', 'audit_logs']
      },
      professional: {
        maxDevices: 50,
        maxTasks: 500,
        maxUsers: 10,
        maxWorkflows: 50,
        features: ['basic_scheduling', 'advanced_scheduling', 'notifications', 'audit_logs']
      },
      enterprise: {
        maxDevices: Infinity,
        maxTasks: Infinity,
        maxUsers: Infinity,
        maxWorkflows: Infinity,
        features: ['basic_scheduling', 'advanced_scheduling', 'notifications', 'workflows', 'multi_tenant', 'audit_logs', 'sso', 'custom_integrations']
      }
    };

    return plans[plan] || plans.starter;
  }

  /**
   * Upgrade tenant plan
   */
  upgradeTenantPlan(tenantId, newPlan) {
    try {
      this.db.prepare(
        `UPDATE tenants SET plan = ?, updated_at = ?
         WHERE id = ?`
      ).run(newPlan, new Date().toISOString(), tenantId);

      console.log(`[MultiTenant] Upgraded tenant ${tenantId} to ${newPlan}`);
      return this.getTenant(tenantId);
    } catch (error) {
      console.error('[MultiTenant] Plan upgrade failed:', error);
      throw error;
    }
  }

  /**
   * Enforce tenant isolation in queries
   */
  getTenantDevices(tenantId) {
    return this.db.prepare(
      `SELECT * FROM devices WHERE tenant_id = ?`
    ).all(tenantId);
  }

  /**
   * Generate secure API key
   */
  generateAPIKey() {
    const crypto = require('crypto');
    return `momobot_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Hash API key (for storage)
   */
  hashKey(apiKey) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * List all tenants (admin only)
   */
  listTenants() {
    return this.db.prepare(
      `SELECT id, name, email, subdomain, plan, status, created_at FROM tenants`
    ).all();
  }

  /**
   * Suspend tenant
   */
  suspendTenant(tenantId, reason) {
    this.db.prepare(
      `UPDATE tenants SET status = ?, suspended_reason = ?, updated_at = ?
       WHERE id = ?`
    ).run('suspended', reason, new Date().toISOString(), tenantId);
  }

  /**
   * Reactivate tenant
   */
  reactivateTenant(tenantId) {
    this.db.prepare(
      `UPDATE tenants SET status = ?, suspended_reason = NULL, updated_at = ?
       WHERE id = ?`
    ).run('active', new Date().toISOString(), tenantId);
  }
}

module.exports = MultiTenantManager;
