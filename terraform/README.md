# MomoBot Terraform Module

Automated infrastructure provisioning for MomoBot on AWS, Azure, and GCP.

## Features

✅ **Multi-cloud support**: AWS, Azure, GCP
✅ **Kubernetes cluster setup**: EKS, AKS, GKE
✅ **Database provisioning**: RDS PostgreSQL, Azure Database, Cloud SQL
✅ **Load balancing**: ALB/NLB setup and configuration
✅ **Auto-scaling**: HPA for pods, ASG for nodes
✅ **Monitoring**: CloudWatch, Azure Monitor, Stackdriver
✅ **Networking**: VPC, subnets, security groups
✅ **Backup & disaster recovery**: Automated backups and restore points
✅ **SSL/TLS**: Certificate management with ACM/Azure Certificates
✅ **Multi-tenant setup**: Namespace isolation and RBAC

## Prerequisites

- Terraform >= 1.0
- Cloud provider CLI configured (AWS CLI, Azure CLI, or gcloud)
- kubectl installed
- Helm 3+ installed

## Quick Start

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Configure Variables

Create a `terraform.tfvars` file:

```hcl
cloud_provider               = "aws"
environment                  = "production"
aws_region                   = "us-east-1"
momobot_version              = "latest"
replica_count                = 3
enable_multi_tenant          = true
enable_notifications         = true
storage_size_gb              = 50
database_backup_retention_days = 30
```

### 3. Plan Deployment

```bash
terraform plan -out=momobot.tfplan
```

### 4. Apply Configuration

```bash
terraform apply momobot.tfplan
```

### 5. Get Outputs

```bash
terraform output -json
```

## Deployment Examples

### AWS Deployment

```bash
terraform apply \
  -var="cloud_provider=aws" \
  -var="aws_region=us-east-1" \
  -var="aws_instance_type=t3.large" \
  -var="replica_count=3"
```

### Azure Deployment

```bash
terraform apply \
  -var="cloud_provider=azure" \
  -var="environment=production" \
  -var="replica_count=3"
```

### GCP Deployment

```bash
terraform apply \
  -var="cloud_provider=gcp" \
  -var="environment=production" \
  -var="replica_count=3"
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Load Balancer                    │
│                   (ALB/NLB/ALB)                     │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌──────▼────────┐        ┌───────▼──────┐
│  MomoBot      │        │  MomoBot     │
│  Pod (x3)    │        │  Pod (x3)    │
│  Replicas    │        │  Replicas    │
└──────┬────────┘        └───────┬──────┘
       │                         │
       └────────────┬────────────┘
                    │
        ┌───────────▼───────────┐
        │   RDS/Cloud SQL       │
        │   (PostgreSQL)        │
        │   Multi-AZ Setup      │
        └───────────────────────┘
```

## Security

🔒 **Security Features**:
- VPC isolation
- Security groups with minimal permissions
- Encrypted database (RDS encryption)
- TLS/SSL for all communications
- RBAC for Kubernetes access
- Secrets management (AWS Secrets Manager, Azure KeyVault)
- Network policies for pod-to-pod communication

## Monitoring & Logging

📊 **Integrated Monitoring**:
- CloudWatch (AWS)
- Azure Monitor (Azure)
- Stackdriver (GCP)
- Prometheus (Kubernetes)
- Grafana dashboards

## Auto-Scaling

📈 **Auto-Scaling Features**:
- Horizontal Pod Autoscaler (HPA): 2-10 replicas
- Node autoscaling: Dynamic based on demand
- Database auto-scaling: Storage and IOPS

## Cost Optimization

💰 **Cost-Saving Features**:
- Reserved instances support
- Spot instances for non-critical workloads
- Rightsizing recommendations
- Auto-shutdown in non-production environments

## Backing Up & Disaster Recovery

🔄 **Backup Strategy**:
- Daily automated database backups
- Retention: 7-30 days (configurable)
- Cross-region replication (optional)
- Point-in-time recovery

## Managing State

Terraform state is stored in S3 (AWS) with encryption and locking:

```bash
# Create S3 bucket for state
aws s3api create-bucket --bucket momobot-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket momobot-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

## Destroying Resources

⚠️ **Warning**: This will destroy all infrastructure:

```bash
terraform destroy
```

For safer deletion, use `-target`:

```bash
terraform destroy -target=kubernetes_namespace.momobot
```

## Troubleshooting

### State Lock Issues

```bash
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

### Provider Authentication

**AWS**:
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
```

**Azure**:
```bash
az login
```

**GCP**:
```bash
gcloud auth application-default login
```

## Advanced Configuration

### Custom Domain with SSL

Update load balancer listener rules:

```hcl
resource "aws_lb_listener" "momobot_https" {
  load_balancer_arn = aws_lb.momobot[0].arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.momobot[0].arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.momobot[0].arn
  }
}
```

### Adding Custom Metrics

```hcl
resource "aws_cloudwatch_metric_alarm" "momobot_cpu" {
  alarm_name          = "momobot-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_actions       = [aws_sns_topic.alerts[0].arn]
}
```

## License

MIT - See [`../../LICENSE`](../../LICENSE)

## Support

For issues or questions:
- GitHub Issues: https://github.com/atulpokharel-gp/momobot/issues
- Documentation: https://momobot.io/docs

---

**Happy automating!** 🚀
