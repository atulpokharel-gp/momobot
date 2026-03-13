# MomoBot Terraform Module
# Provisions MomoBot infrastructure on AWS, Azure, or GCP

variable "cloud_provider" {
  description = "Cloud provider (aws, azure, gcp)"
  type        = string
  validation {
    condition     = contains(["aws", "azure", "gcp"], var.cloud_provider)
    error_message = "Cloud provider must be aws, azure, or gcp"
  }
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "momobot_version" {
  description = "MomoBot Docker image version"
  type        = string
  default     = "latest"
}

variable "replica_count" {
  description = "Number of replicas for MomoBot deployment"
  type        = number
  default     = 3
}

variable "enable_multi_tenant" {
  description = "Enable multi-tenant SaaS mode"
  type        = bool
  default     = false
}

variable "enable_notifications" {
  description = "Enable email/Slack notifications"
  type        = bool
  default     = true
}

variable "storage_size_gb" {
  description = "Database storage size in GB"
  type        = number
  default     = 50
}

variable "database_backup_retention_days" {
  description = "Database backup retention period"
  type        = number
  default     = 30
}

# AWS Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

# Local outputs
output "momobot_api_endpoint" {
  description = "MomoBot API endpoint"
  value       = try(aws_lb.momobot[0].dns_name, azurerm_container_registry.momobot[0].login_server, null)
}

output "momobot_dashboard_url" {
  description = "MomoBot Dashboard URL"
  value       = "http://${try(aws_lb.momobot[0].dns_name, azurerm_container_registry.momobot[0].login_server, null)}:3000"
}

output "kubernetes_config" {
  description = "Kubernetes configuration"
  value       = {
    namespace = "momobot"
    replicas  = var.replica_count
  }
}

output "features_enabled" {
  description = "Enabled features"
  value       = {
    multi_tenant   = var.enable_multi_tenant
    notifications  = var.enable_notifications
    scheduling     = true
    workflows      = true
  }
}
