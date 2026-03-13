# MomoBot Terraform Main Configuration

terraform {
  required_version = ">= 1.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.50"
    }
  }

  backend "s3" {
    bucket         = "momobot-terraform-state"
    key            = "momobot/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

# Conditional AWS Provider
provider "aws" {
  count  = var.cloud_provider == "aws" ? 1 : 0
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Service     = "momobot"
      ManagedBy   = "terraform"
    }
  }
}

# EKS Cluster (AWS)
resource "aws_eks_cluster" "momobot" {
  count           = var.cloud_provider == "aws" ? 1 : 0
  name            = "momobot-${var.environment}"
  role_arn        = aws_iam_role.eks_cluster_role[0].arn
  version         = "1.28"

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]
}

# EKS Node Group
resource "aws_eks_node_group" "momobot" {
  count           = var.cloud_provider == "aws" ? 1 : 0
  cluster_name    = aws_eks_cluster.momobot[0].name
  node_group_name = "momobot-${var.environment}-nodes"
  node_role_arn   = aws_iam_role.eks_node_role[0].arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = [var.aws_instance_type]

  scaling_config {
    desired_size = var.replica_count
    max_size     = var.replica_count * 2
    min_size     = var.replica_count
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_policy
  ]
}

# RDS Database (AWS)
resource "aws_db_instance" "momobot" {
  count              = var.cloud_provider == "aws" ? 1 : 0
  identifier         = "momobot-${var.environment}"
  engine             = "postgres"
  engine_version     = "14.7"
  instance_class     = "db.t3.micro"
  allocated_storage  = var.storage_size_gb
  storage_encrypted  = true
  
  db_name  = "momobot"
  username = "admin"
  password = random_password.db_password[0].result

  backup_retention_period = var.database_backup_retention_days
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  skip_final_snapshot = var.environment != "production"

  tags = {
    Name = "momobot-${var.environment}"
  }
}

# Random password for database
resource "random_password" "db_password" {
  count  = var.cloud_provider == "aws" ? 1 : 0
  length = 32
  special = true
}

# Kubernetes Provider
provider "kubernetes" {
  host                   = var.cloud_provider == "aws" ? aws_eks_cluster.momobot[0].endpoint : null
  cluster_ca_certificate = var.cloud_provider == "aws" ? base64decode(aws_eks_cluster.momobot[0].certificate_authority[0].data) : null
  token                  = data.aws_eks_auth.momobot[0].token
}

# EKS Auth Token
data "aws_eks_auth" "momobot" {
  count = var.cloud_provider == "aws" ? 1 : 0
  name  = aws_eks_cluster.momobot[0].name
}

# Kubernetes Namespace
resource "kubernetes_namespace" "momobot" {
  metadata {
    name = "momobot"
    labels = {
      "environment" = var.environment
    }
  }
}

# Helm Provider
provider "helm" {
  kubernetes {
    host                   = var.cloud_provider == "aws" ? aws_eks_cluster.momobot[0].endpoint : null
    cluster_ca_certificate = var.cloud_provider == "aws" ? base64decode(aws_eks_cluster.momobot[0].certificate_authority[0].data) : null
    token                  = data.aws_eks_auth.momobot[0].token
  }
}

# Deploy MomoBot using Helm
resource "helm_release" "momobot" {
  name       = "momobot"
  repository = "https://charts.momobot.io"
  chart      = "momobot"
  version    = var.momobot_version
  namespace  = kubernetes_namespace.momobot.metadata[0].name

  values = [
    yamlencode({
      replicaCount = var.replica_count
      environment  = var.environment

      server = {
        image = "momobot-server:${var.momobot_version}"
        resources = {
          requests = {
            memory = "256Mi"
            cpu    = "250m"
          }
          limits = {
            memory = "512Mi"
            cpu    = "500m"
          }
        }
      }

      client = {
        image = "momobot-client:${var.momobot_version}"
        resources = {
          requests = {
            memory = "128Mi"
            cpu    = "100m"
          }
          limits = {
            memory = "256Mi"
            cpu    = "200m"
          }
        }
      }

      features = {
        multiTenant   = var.enable_multi_tenant
        notifications = var.enable_notifications
        scheduling    = true
        workflows     = true
      }

      database = var.cloud_provider == "aws" ? {
        host     = aws_db_instance.momobot[0].endpoint
        port     = 5432
        name     = aws_db_instance.momobot[0].db_name
        username = aws_db_instance.momobot[0].username
      } : {}
    })
  ]

  depends_on = [
    aws_eks_node_group.momobot
  ]
}

# Load Balancer (AWS)
resource "aws_lb" "momobot" {
  count           = var.cloud_provider == "aws" ? 1 : 0
  name            = "momobot-${var.environment}-alb"
  internal        = false
  load_balancer_type = "application"
  security_groups = [aws_security_group.alb[0].id]
  subnets         = aws_subnet.public[*].id

  tags = {
    Name = "momobot-${var.environment}"
  }
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  count = var.cloud_provider == "aws" ? 1 : 0
  name  = "momobot-${var.environment}-alb-sg"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# IAM Role for EKS Cluster
resource "aws_iam_role" "eks_cluster_role" {
  count = var.cloud_provider == "aws" ? 1 : 0
  name  = "momobot-${var.environment}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for EKS Cluster
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  count      = var.cloud_provider == "aws" ? 1 : 0
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster_role[0].name
}

# IAM Role for EKS Node
resource "aws_iam_role" "eks_node_role" {
  count = var.cloud_provider == "aws" ? 1 : 0
  name  = "momobot-${var.environment}-eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for EKS Node
resource "aws_iam_role_policy_attachment" "eks_worker_policy" {
  count      = var.cloud_provider == "aws" ? 1 : 0
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_role[0].name
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "momobot" {
  count             = var.cloud_provider == "aws" ? 1 : 0
  name              = "/aws/eks/momobot-${var.environment}"
  retention_in_days = var.database_backup_retention_days

  tags = {
    Name = "momobot-${var.environment}"
  }
}

# VPC (minimal example)
resource "aws_vpc" "momobot" {
  count             = var.cloud_provider == "aws" ? 1 : 0
  cidr_block        = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support = true

  tags = {
    Name = "momobot-${var.environment}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = var.cloud_provider == "aws" ? 2 : 0
  vpc_id                  = aws_vpc.momobot[0].id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available[0].names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "momobot-${var.environment}-public-${count.index + 1}"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = var.cloud_provider == "aws" ? 2 : 0
  vpc_id            = aws_vpc.momobot[0].id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available[0].names[count.index]

  tags = {
    Name = "momobot-${var.environment}-private-${count.index + 1}"
  }
}

# Availability Zones
data "aws_availability_zones" "available" {
  count = var.cloud_provider == "aws" ? 1 : 0
  state = "available"
}
