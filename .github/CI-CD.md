# CI/CD Pipeline Documentation

## Overview

MomoBot includes a comprehensive **GitHub Actions CI/CD pipeline** that automates testing, building, and deployment of the platform across all environments.

## Workflows

### 1. **Main CI Pipeline** (`.github/workflows/ci.yml`)

Triggers on: `push` to `main`/`develop` and `pull_request`

#### Jobs:

| Job | Purpose | Status |
|-----|---------|--------|
| **lint** | Code quality checks | ✅ ESLint + Prettier |
| **build** | Compile client, server, agent | ✅ Produces artifacts |
| **test** | Unit & integration tests | ✅ Jest + Mocha |
| **security** | Trivy + npm audit | ✅ SARIF export |
| **docker** | Build & push Docker images | ✅ GHCR registry |
| **deploy-staging** | Deploy to staging (optional) | ⏳ Manual trigger |
| **deploy-production** | Deploy to prod (requires tag) | ⏳ Manual trigger |
| **status** | Final pipeline status | ✅ Slack notification |

### 2. **Docker Release Pipeline** (`.github/workflows/docker-release.yml`)

Triggers on: `release` published to `main`

- Builds and pushes containers to **Docker Hub**
- Creates semantic versioning tags
- Updates release notes with image locations

### 3. **Security Scanning** (`.github/workflows/codeql-analysis.yml`)

Triggers automatically:
- Every push to `main`/`develop`
- Every pull request
- Weekly on Tuesday at 6:32 AM UTC

Uses GitHub's **CodeQL** engine for static analysis on JavaScript/TypeScript code.

### 4. **Dependency Management** (`.github/dependabot.yml`)

Automatically creates PRs for:
- **npm** dependencies (client, server, agent) - Weekly Mondays
- **Docker** base images - Weekly Tuesdays
- **GitHub Actions** - Weekly Wednesdays

All PRs include:
- Automatic reviewers
- Semantic labels
- Conventional commit messages

---

## Environment Secrets

Add these to GitHub repository settings (Settings → Secrets and variables → Actions):

```
# Docker Registry
DOCKER_USERNAME         # Docker Hub username
DOCKER_PASSWORD         # Docker Hub access token

# Slack Notifications (Optional)
SLACK_WEBHOOK_URL       # Incoming webhook for notifications

# GitHub Container Registry
GITHUB_TOKEN            # Auto-provided by GitHub Actions
```

---

## Pipeline Flow

```
┌─────────────────────────────────────────┐
│  Push to main/develop or PR opened      │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼──────┐
        │   LINT      │ (ESLint, Prettier)
        └──────┬──────┘
               │
        ┌──────▼──────┐
   ┌────┤   BUILD    │ (Webpack, Vite)
   │    └──────┬──────┘
   │           │
   │  ┌────────▼────────┐
   └─►│     TEST        │ (Jest, coverage)
      └────────┬────────┘
               │
        ┌──────▼──────────┐
        │   SECURITY      │ (CodeQL, Trivy)
        └──────┬──────────┘
               │
        ┌──────▼───────────────┐
        │   Docker Build       │
        │   (if main branch)   │
        └──────┬───────────────┘
               │
      ┌────────▼────────┐
      │  PUSH to GHCR   │
      └────────┬────────┘
               │
        ┌──────▼──────┐
        │   NOTIFY    │ (Slack)
        └─────────────┘
```

---

## Build Artifacts

### Client
- **Output**: `client/dist/`
- **Format**: Static HTML/CSS/JS
- **Size**: ~2-4 MB
- **Served by**: Nginx

### Server
- **Output**: `server/dist/`
- **Format**: Node.js/commonjs
- **Entry**: `dist/index.js`
- **Runtime**: Node.js 18+

### Agent
- **Output**: `momobot-agent/dist/`
- **Format**: Executable Node.js
- **Deployment**: Docker or binary

---

## Docker Images

### Published to:
- **GitHub Container Registry (GHCR)**: `ghcr.io/atulpokharel-gp/momobot/*`
- **Docker Hub** (on release): `docker.io/atulpokharel/momobot-*`

### Images:
1. **momobot-server** - Express.js backend
2. **momobot-client** - React frontend
3. **momobot-agent** - Local agent for devices

### Tags:
- `main-${COMMIT_SHA}` - Every main push
- `develop` - Develop branch latest
- `v1.0.0` - Semantic version (on release)
- `latest` - Latest stable

---

## Deployment Strategies

### Staging Deployment
Triggered on: Push to `develop` branch

```bash
# Deployment script location
./scripts/deploy-staging.sh
```

Requirements:
- Staging server SSH access
- Environment variables configured

### Production Deployment
Triggered on: Merge to `main` with `chore: release` commit

```bash
# Deployment script location
./scripts/deploy-production.sh
```

Requirements:
- Production server access
- All tests passing
- Security scan approved

---

## Running Locally

### Test CI Locally (act)

Install [act](https://github.com/nektos/act):

```bash
# Run full pipeline
act

# Run specific workflow
act -j build

# Run on specific event
act -e pull_request
```

### Build Docker Images Locally

```bash
# Server
docker build -f server/Dockerfile -t momobot-server:local ./server

# Client
docker build -f client/Dockerfile -t momobot-client:local ./client

# Agent
docker build -f momobot-agent/Dockerfile -t momobot-agent:local ./momobot-agent
```

---

## Troubleshooting

### Build Fails
1. Check GitHub Actions logs (Actions tab → workflow run)
2. Run `npm ci` locally to verify dependencies
3. Check Node.js version compatibility (18+ required)

### Tests Fail
```bash
# Run locally first
npm test

# Check coverage
npm run coverage
```

### Docker Push Fails
- Verify Docker Hub credentials in Secrets
- Check image naming follows GHCR conventions
- Ensure image tags are valid (lowercase, no special chars)

### Deployment Fails
- Check deployment scripts exist in `./scripts/`
- Verify SSH keys configured in repository
- Check environment variables in GitHub Actions

---

## Best Practices

✅ **Do**
- Always write tests before code
- Use conventional commits: `feat:`, `fix:`, `chore:`
- Tag releases with semantic versioning
- Keep workflows DRY (reusable steps)
- Monitor action execution time (limit to <10 mins)

❌ **Don't**
- Commit secrets/credentials to repo
- Skip security scans
- Merge with failing tests
- Use `any` TypeScript type without reason
- Store sensitive data in artifacts

---

## Monitoring & Notifications

### Slack Integration
Pipeline sends notifications to Slack for:
- Build failures
- Security vulnerabilities found
- Successful deployments
- Test coverage changes

### GitHub Status Checks
All checks must pass before merging:
- ✅ lint
- ✅ build
- ✅ test
- ✅ security

---

## Future Enhancements

- [ ] Performance benchmarking
- [ ] E2E test automation
- [ ] Automated changelog generation
- [ ] Multi-cloud deployment
- [ ] Blue-green deployment strategy
- [ ] Canary releases
- [ ] Automated rollback on failure
- [ ] Load testing in staging

---

## Contact & Support

For CI/CD issues:
1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Open issue with `ci/cd` label
4. Contact: @atulpokharel-gp

---

**Last Updated**: March 13, 2026
**Version**: 1.0.0
