# MomoBot: Consent-Based Remote Task Automation Platform

🤖 **Enterprise-grade, security-first automation platform** for organizations that need powerful task automation without sacrificing security, audit trails, or compliance.

[![GitHub](https://img.shields.io/badge/GitHub-atulpokharel--gp%2Fmomobot-blue?logo=github)](https://github.com/atulpokharel-gp/momobot)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12%2B-blue)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)

---

## Table of Contents

1. [What Makes MomoBot Different?](#what-makes-momobot-different)
2. [Multi-Occupation Use Cases](#multi-occupation-use-cases)
3. [Features](#features)
4. [Architecture](#architecture)
5. [Installation](#installation)
6. [Running MomoBot](#running-momobot)
7. [Configuration](#configuration)
8. [Admin Dashboard](#admin-dashboard)
9. [Contributing](#contributing)
10. [License](#license)

---

## What Makes MomoBot Different?

While traditional RPA and bot agents (Claw-bot, UiPath, Blue Prism) prioritize speed and flexibility, **MomoBot prioritizes security and consent**:

| Feature | MomoBot | Traditional Bots |
|---------|---------|------------------|
| **Command Signing** | ✅ Cryptographic HMAC + nonce | ❌ Often unencrypted |
| **Replay Protection** | ✅ Built-in | ❌ Not enforced |
| **Unrestricted Shell Access** | ❌ Blocked by design | ✅ Full access (security risk) |
| **Task Allowlisting** | ✅ Explicit approval required | ❌ Implicit trust |
| **Instant Device Revocation** | ✅ Seconds | ❌ Minutes/hours |
| **Immutable Audit Trail** | ✅ Every command logged | ⚠️ Varies by product |
| **Multi-Factor Auth** | ✅ TOTP/WebAuthn ready | ⚠️ Enterprise only |
| **Offline Resilience** | ✅ Local queue + safe retry | ⚠️ Central dependency |

---

## Multi-Occupation Use Cases

MomoBot serves **diverse industries and roles**, enabling secure automation across:

### 🏥 **Healthcare & Life Sciences**
- **Clinical Operations**: Automated patient data transfers, HIPAA-compliant task execution
- **Lab Management**: Safe automation of equipment control, sample tracking
- **Compliance**: Audit trail for regulatory requirements (HIPAA, FDA 21 CFR Part 11)

### 🏦 **Finance & Banking**
- **Transaction Processing**: Secure fund transfers, batch reconciliation
- **Compliance**: Immutable logs for AML (Anti-Money Laundering), KYC (Know Your Customer)
- **Risk Management**: Automated monitoring with revocation capability

### ⚡ **Energy & Critical Infrastructure**
- **Grid Operations**: Trusted automation for SCADA/ICS systems with audit trails
- **Maintenance Scheduling**: Safe remote execution on critical equipment
- **Security**: Device-level identity and mTLS for sensitive networks

### 🏢 **Enterprise IT & Operations**
- **Patch Management**: Controlled rollout with instant abort capability
- **User Provisioning**: Audited access control, compliance reports
- **Infrastructure Automation**: Infrastructure-as-Code with human oversight

### 📞 **Customer Service & Support**
- **Ticket Automation**: Secure routing, response generation, escalation
- **Knowledge Management**: Safe documentation updates with approval workflow
- **Multi-tenancy**: Isolated operations per client/tenant

### 🏭 **Manufacturing & Supply Chain**
- **Production Line Control**: Safe automation with human approval gates
- **Inventory Management**: Real-time tracking with compliance logs
- **Quality Assurance**: Automated testing with audit evidence

### 🚀 **DevOps & Cloud Operations**
- **CI/CD Automation**: Secure pipeline execution with task allowlisting
- **Infrastructure Health Checks**: Automated remediation with logging
- **Multi-cloud Management**: Unified control across AWS, Azure, GCP

### 🔬 **Research & Academia**
- **Data Processing**: Secure analysis workflows with reproducibility logs
- **Lab Automation**: Safe equipment orchestration with consent
- **Publishing**: Automated manuscript workflows with approval gates

---

## Features

✅ **Zero-Trust Architecture**
- Cryptographic command signing (HMAC + nonce)
- Replay attack protection
- Device-level identity with mTLS

✅ **Consent-First Execution**
- No unrestricted remote shell
- Explicit task allowlisting
- Real-time admin control

✅ **Enterprise Audit & Compliance**
- Immutable command/result logs
- RBAC: owner, admin, operator, viewer
- Multi-factor authentication (TOTP/WebAuthn)

✅ **Cross-Platform Reliability**
- Windows & Linux agents
- Safe self-update mechanism
- Offline resilience with local queue

✅ **Real-Time Observability**
- WebSocket live task updates
- Centralized logs with correlation IDs
- Metrics & alerts for offline detection

✅ **Developer-Friendly**
- FastAPI + Django backend
- React frontend with Tailwind CSS
- Python agent SDK
- Full test coverage + CI/CD

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Web Dashboard (React)                │
│                    Port: 3000                           │
└────────────────────┬────────────────────────────────────┘
                     │ (REST + WebSocket)
                     ▼
┌─────────────────────────────────────────────────────────┐
│              MomoBot Server (Node.js)                   │
│              Port: 4000                                 │
│  • WebSocket gateway for real-time updates             │
│  • REST API for device management & commands           │
│  • SQLite database for persistence                     │
└────────────────────┬────────────────────────────────────┘
                     │ (HTTPS + Signed Commands)
                     ▼
┌─────────────────────────────────────────────────────────┐
│          Local Agents (Python / Windows+Linux)          │
│  • Enrolled device identity                            │
│  • Secure command verification & execution             │
│  • Immutable local logging                             │
│  • Offline queue with safe retry                       │
└─────────────────────────────────────────────────────────┘

Control Plane (Django):
├─ User & organization management
├─ Device registration & revocation
├─ Task allowlist policy engine
└─ Admin dashboard (port 8100+)
```

---

## Installation

### Prerequisites

**Option 1: Windows (Native)**
- Node.js 18+ ([download](https://nodejs.org/))
- npm 9+ (comes with Node.js)
- Git 2.53+

**Option 2: WSL2 (Recommended)**
- Windows 10/11 with WSL2 enabled
- Ubuntu 20.04+ or other WSL distro
- Node.js 18+ (available in Ubuntu by default after `apt update`)

**Option 3: Docker**
- Docker Desktop 20.10+
- docker-compose 2.0+

---

## Running MomoBot

### Quick Start (Windows via WSL2) 🚀

**1. Clone and navigate to the project:**
```bash
cd /home/your-user
git clone https://github.com/atulpokharel-gp/momobot.git
cd momobot
```

**2. Install dependencies (from WSL):**
```bash
wsl -d Ubuntu -- bash -lc "cd ~/momobot && npm install && npm run install:all"
```

**3. Start the platform:**
```bash
wsl -d Ubuntu -- bash -lc "cd ~/momobot && npm run dev"
```

**4. Open your browser:**
- **Dashboard**: http://localhost:3000
- **Server Health**: http://localhost:4000/health
- **API Docs**: http://localhost:4000/api/docs

**5. Log in with default credentials:**
- Email: `admin@momobot.local`
- Password: `Admin@123456` ⚠️ **Change immediately in production**

---

### Installation Methods

#### **Method A: Native Windows**
```bash
cd momobot-platform
npm install
npm run install:all
npm run dev
```

#### **Method B: WSL2 (Recommended for better performance)**
```bash
# From Windows PowerShell:
wsl -d Ubuntu -- bash -lc "cd ~/momobot && npm install && npm run install:all && npm run dev"

# Or from WSL terminal:
cd ~/momobot
npm install && npm run install:all
npm run dev
```

#### **Method C: Docker Compose**
```bash
# From project root:
docker-compose up -d

# Check logs:
docker-compose logs -f

# Tear down:
docker-compose down
```

#### **Method D: Manual Start (Advanced)**
```bash
# Terminal 1 - Server:
cd momobot-platform/server
npm install
npm run dev    # Runs on port 4000

# Terminal 2 - Client (in another terminal):
cd momobot-platform/client
npm install
npm run dev    # Runs on port 3000

# Terminal 3 - Agent (optional, on target device):
cd momobot-platform/momobot-agent
npm install
npm start
```

---

## Configuration

### Environment Variables

**Server** (`.env` in `server/` directory):
```env
NODE_ENV=development
PORT=4000
ADMIN_EMAIL=admin@momobot.local
ADMIN_PASSWORD=Admin@123456      # ⚠️ Change in production
JWT_SECRET=your-secret-key-here
DATABASE_PATH=./data/momobot.db
```

**Client** (configured in `vite.config.js`):
```javascript
server: {
  port: 3000,
  proxy: {
    '/api': { target: 'http://localhost:4000', changeOrigin: true },
    '/socket.io': { target: 'http://localhost:4000', ws: true }
  }
}
```

**Agent** (`.env` in `momobot-agent/` on each device):
```env
SERVER_URL=http://your-server.com:4000
DEVICE_NAME=my-workstation
AGENT_TOKEN=provided-by-admin
```

---

## Admin Dashboard

Once running, access the dashboard at **http://localhost:3000**:

### Main Features:

📊 **Dashboard**
- Real-time agent status overview
- Task execution metrics
- System health indicators

👥 **Devices**
- Register new devices
- View device status & history
- Revoke device access instantly

📋 **Tasks**
- Create new automation tasks
- Manage allowlists
- Monitor execution & results

🔐 **Settings**
- User management & MFA setup
- Organization roles & permissions
- API key management
- Audit log viewer

📈 **Analytics**
- Task success/failure rates
- Agent utilization
- Compliance reports

---

## Development

### Project Structure
```
momobot-platform/
├── server/           # Node.js backend (Express/Socket.io)
├── client/           # React frontend (Vite + Tailwind)
├── momobot-agent/    # Agent for deployment on devices
└── start.bat         # Windows quick-start script
```

### Running Tests
```bash
cd server && npm test
cd ../client && npm test
cd ../momobot-agent && npm test
```

### Building for Production
```bash
# Frontend:
cd client && npm run build    # Creates dist/ folder

# Server:
cd server && npm run build

# Docker:
docker-compose -f docker-compose.prod.yml up -d
```

---

## Security Best Practices

🔒 **Before Going to Production:**

1. **Change default credentials**
   - Update admin password immediately
   - Generate new JWT secrets

2. **Enable HTTPS/TLS**
   - Install SSL certificates
   - Update SERVER_URL to https://

3. **Enable MFA**
   - Require TOTP for all admin users
   - Configure WebAuthn for critical operations

4. **Audit & Monitor**
   - Review audit logs regularly
   - Set up alerts for failed tasks
   - Monitor agent connectivity

5. **Network Security**
   - Use mTLS between agents and server
   - Restrict API access by IP/firewall
   - Scan for secrets before commit

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000 or 4000 (Windows):
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# WSL:
sudo lsof -i :3000 && sudo kill -9 <PID>
```

### Dependency Issues
```bash
# Clear cache and reinstall:
rm -rf node_modules package-lock.json
npm install

# Or use clean install:
npm ci
```

### Database Locked
```bash
# Remove existing database and restart:
rm server/data/momobot.db
npm run dev
```

### Agent Won't Connect
- Check server is running: `curl http://localhost:4000/health`
- Verify agent token in `.env`
- Check firewall/proxy rules
- Review server logs: `docker-compose logs server`

---

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Code Standards
- Use ESLint for JavaScript/TypeScript
- Follow PEP 8 for Python
- Write tests for new features
- Update docs if adding features

---

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

## Support & Community

- **Issues**: [GitHub Issues](https://github.com/atulpokharel-gp/momobot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/atulpokharel-gp/momobot/discussions)
- **Security**: Report to [security@momobot.local](mailto:security@momobot.local)

---

## Roadmap

🔮 **Upcoming Features:**
- [ ] Kubernetes agent deployment
- [ ] Advanced scheduling & cron support
- [ ] Email/Slack notifications
- [ ] Task templates & workflows
- [ ] Multi-tenant SaaS mode
- [ ] Terraform provisioning module
- [ ] Advanced analytics & ML-based anomaly detection

---

## Acknowledgments

Built with:
- **Backend**: Express.js, Node.js, SQLite
- **Frontend**: React, Vite, Tailwind CSS
- **Python Agent**: FastAPI, Pydantic
- **DevOps**: Docker, GitHub Actions

---

**Ready to automate securely?** ⭐ Star us on [GitHub](https://github.com/atulpokharel-gp/momobot) and join the conversation!

