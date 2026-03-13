# MomoBot Advanced Features Deployment Guide

## Overview

This guide covers deploying MomoBot with advanced features:
- ✅ Kubernetes Agent Deployment
- ✅ Advanced Scheduling & Cron Support
- ✅ Email/Slack Notifications
- ✅ Task Templates & Workflows
- ✅ Multi-Tenant SaaS Mode
- ✅ Terraform Provisioning Module

---

## 1. Kubernetes Agent Deployment

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace momobot

# Apply deployment
kubectl apply -f k8s/deployment.yaml

# Verify deployment
kubectl get pods -n momobot
kubectl logs -f momobot-server-xxxxx -n momobot
```

### Build Docker Images

```bash
# Build server image
docker build -t momobot-server:latest -f Dockerfile.prod .

# Build client image
docker build -t momobot-client:latest -f client/Dockerfile .

# Push to registry
docker tag momobot-server:latest your-registry/momobot-server:latest
docker push your-registry/momobot-server:latest
```

### Scale Pods

```bash
# Scale server replicas
kubectl scale deployment/momobot-server --replicas=5 -n momobot

# Check HPA status
kubectl get hpa -n momobot
```

---

## 2. Advanced Scheduling & Cron Support

### Configuration

Add to your `.env`:

```env
ENABLE_SCHEDULER=true
SCHEDULER_CHECK_INTERVAL=60000
```

### Usage Examples

#### Create a Cron Schedule via API

```bash
curl -X POST http://localhost:4000/api/tasks/123/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cron_expression": "0 2 * * *",
    "description": "Daily backup at 2 AM UTC",
    "device_id": "device-001"
  }'
```

#### Cron Expression Examples

```
0 2 * * *           # Every day at 2 AM
0 */6 * * *         # Every 6 hours
0 0 * * 0           # Every Sunday at midnight
*/15 * * * *        # Every 15 minutes
0 9-17 * * 1-5      # Every hour 9-5, Monday-Friday
```

#### Dashboard Usage

1. Go to **Tasks** → **Create Schedule**
2. Select task and device
3. Enter cron expression (validates in real-time)
4. Set description and submit

---

## 3. Email/Slack Notifications

### Configuration

#### Email Setup (SMTP)

Add to `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@momobot.local
```

#### Slack Setup

1. Create Slack App: https://api.slack.com/apps
2. Enable **Incoming Webhooks**
3. Create webhook for each channel
4. Add to MomoBot config:

```env
SLACK_WEBHOOK_ALERTS=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_WEBHOOK_TASKS=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Usage

#### Notify on Task Completion

```javascript
const notificationService = new NotificationService(config);

await notificationService.notifyTaskExecution(
  'task-123',
  'device-001',
  'success',
  { output: 'Task completed successfully' },
  {
    email: 'admin@company.com',
    slackChannel: 'alerts'
  }
);
```

#### Notify Device Offline Alert

```javascript
await notificationService.notifyDeviceOffline(
  'device-001',
  '2026-03-13T15:30:00Z',
  {
    slackChannel: 'ops-alerts'
  }
);
```

---

## 4. Task Templates & Workflows

### Create a Task Template

```bash
curl -X POST http://localhost:4000/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "File Backup Template",
    "description": "Backs up critical files",
    "task_type": "shell",
    "payload": {
      "command": "tar -czf backup-${DATE}.tar.gz ${BACKUP_PATH}"
    },
    "variables": {
      "DATE": "2026-03-13",
      "BACKUP_PATH": "/var/data"
    }
  }'
```

### Create a Workflow

```bash
curl -X POST http://localhost:4000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Backup Workflow",
    "description": "Backs up and verifies data daily",
    "steps": [
      {
        "id": "step-1",
        "templateId": "template-123",
        "onFailure": "stop",
        "variables": {
          "BACKUP_PATH": "/critical/data"
        }
      },
      {
        "id": "step-2",
        "templateId": "template-456",
        "onFailure": "continue",
        "variables": {}
      }
    ]
  }'
```

### Execute Workflow

```bash
curl -X POST http://localhost:4000/api/workflows/456/execute \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "device-001",
    "variables": {
      "CUSTOM_PARAM": "value"
    }
  }'
```

---

## 5. Multi-Tenant SaaS Mode

### Enable Multi-Tenant

Add to `.env`:

```env
MULTI_TENANT_ENABLED=true
MAX_TENANTS=unlimited
```

### Create Tenant (Admin Only)

```bash
curl -X POST http://localhost:4000/api/admin/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "ACME Corporation",
    "email": "admin@acme.com",
    "subdomain": "acme",
    "plan": "professional"
  }'
```

### Available Plans

| Plan | Devices | Tasks | Users | Workflows | Price |
|------|---------|-------|-------|-----------|-------|
| Starter | 5 | 50 | 3 | 5 | $50/mo |
| Professional | 50 | 500 | 10 | 50 | $200/mo |
| Enterprise | ∞ | ∞ | ∞ | ∞ | Custom |

### Tenant API Key

```bash
# Create tenant API key
curl -X POST http://localhost:4000/api/tenants/123/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Terraform Integration",
    "permissions": ["devices:*", "tasks:*"]
  }'
```

### Access Tenant Data

Tenant data is automatically isolated:

```javascript
// All queries automatically filtered by tenant_id
const devices = db.prepare(
  `SELECT * FROM devices WHERE tenant_id = ?`
).all(tenantId);
```

---

## 6. Terraform Provisioning Module

### Prerequisites

```bash
# Install Terraform
brew install terraform  # macOS
choco install terraform # Windows
apt install terraform   # Linux

# Configure cloud credentials
aws configure           # AWS
az login               # Azure
gcloud auth login      # GCP
```

### Deploy on AWS

```bash
cd terraform

# Initialize
terraform init

# Plan
terraform plan \
  -var="cloud_provider=aws" \
  -var="environment=production" \
  -var="replica_count=3"

# Apply
terraform apply \
  -var="cloud_provider=aws" \
  -var="environment=production" \
  -var="replica_count=3"
```

### Get Outputs

```bash
# Display all outputs
terraform output

# Get specific output
terraform output momobot_api_endpoint
```

### Update Deployment

```bash
# Modify terraform.tfvars
echo 'replica_count = 5' >> terraform.tfvars

# Apply changes
terraform apply
```

### Destroy Infrastructure

```bash
# Destroy all resources
terraform destroy

# Destroy specific resource
terraform destroy -target=aws_eks_cluster.momobot
```

---

## 7. Integrated Deployment Flow

### Complete Setup Script

```bash
#!/bin/bash

# 1. Clone repository
git clone https://github.com/atulpokharel-gp/momobot.git
cd momobot

# 2. Infrastructure Setup (Terraform)
cd terraform
terraform init
terraform apply \
  -var="cloud_provider=aws" \
  -var="environment=production" \
  -var="replica_count=3" \
  -var="enable_multi_tenant=true" \
  -var="enable_notifications=true"

# 3. Get Kubeconfig
aws eks update-kubeconfig \
  --name momobot-production \
  --region us-east-1

# 4. Deploy to Kubernetes
cd ../
kubectl apply -f k8s/deployment.yaml

# 5. Verify Deployment
kubectl get pods -n momobot
kubectl get svc -n momobot

# 6. Configure Notifications
export SMTP_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id momobot/smtp-password | jq -r .SecretString)

# 7. Create Initial Tenant
curl -X POST https://momobot.example.com/api/admin/tenants \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "Acme Corp",
    "email": "admin@acme.com",
    "plan": "professional"
  }'

echo "✅ MomoBot deployment complete!"
```

---

## 8. Monitoring & Maintenance

### Health Checks

```bash
# API Health
curl https://momobot.example.com/health

# Kubernetes Health
kubectl get pods -n momobot -w

# Database Health
kubectl exec -it momobot-server-xxxxx -n momobot -- \
  psql -h momobot-db -d momobot -c "SELECT 1"
```

### Backup Database

```bash
# AWS RDS
aws rds create-db-snapshot \
  --db-instance-identifier momobot-production \
  --db-snapshot-identifier momobot-backup-$(date +%Y%m%d)

# View backups
aws rds describe-db-snapshots \
  --db-instance-identifier momobot-production
```

### View Logs

```bash
# Container logs
kubectl logs -f momobot-server-xxxxx -n momobot

# Application logs
kubectl exec momobot-server-xxxxx -n momobot -- tail -f /var/log/momobot.log

# CloudWatch logs
aws logs tail /aws/eks/momobot-production --follow
```

---

## 9. Troubleshooting

### Pod CrashLoopBackOff

```bash
# Check pod logs
kubectl logs momobot-server-xxxxx -n momobot

# Check pod events
kubectl describe pod momobot-server-xxxxx -n momobot
```

### Database Connection Error

```bash
# Test database connection
kubectl run -it --rm debug --image=postgres:14 --restart=Never -- \
  psql -h momobot-db -U admin -d momobot -c "SELECT 1"
```

### Notification Failures

```bash
# Check SMTP configuration
kubectl exec momobot-server-xxxxx -n momobot -- \
  node -e "require('./src/features/notifications.js')"

# Check Slack webhook
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-type: application/json' \
  -d '{"text":"Test message"}'
```

---

## Next Steps

1. ✅ Deploy infrastructure with Terraform
2. ✅ Set up Kubernetes cluster
3. ✅ Configure notifications (Email/Slack)
4. ✅ Create task templates and workflows
5. ✅ Enable multi-tenant mode
6. ✅ Set up monitoring and alerting
7. ✅ Configure backups and disaster recovery

---

For more help: https://momobot.io/docs/advanced-deployment
