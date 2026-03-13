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
9. [Visual Workflow Builder](#visual-workflow-builder)
10. [Task Scheduling](#task-scheduling)
11. [AI-Driven Process Optimization](#ai-driven-process-optimization)
12. [Contributing](#contributing)
13. [License](#license)

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
- Create & schedule automation tasks
- Manage allowlists
- Monitor execution & results
- Schedule recurring tasks (cron expressions)

🔗 **Visual Workflow Builder** ✨ NEW
- n8n-style drag-and-drop interface
- Create complex workflows visually
- 11+ node types: triggers, browser automation, shell commands, file ops, email, conditions, etc.
- Real-time visual connectors (bezier curves) between nodes
- Node configuration panel with parameter editing
- Execute workflows directly from the builder
- View execution logs with success/error tracking
- Save workflows for reuse

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

## Visual Workflow Builder

### Overview
The **Visual Workflow Builder** provides an n8n-style, drag-and-drop interface for creating complex automation workflows without coding.

### Key Features

**Node Palette** (11+ Node Types)
- ▶️ **Start Trigger** - Workflow entry point
- 🌐 **Open Browser** - Launch browser with URL
- ▶️ **Play YouTube** - Play videos with specific video IDs
- 🔗 **Navigate URL** - Navigate to URLs in browser
- ⌨️ **Execute Shell** - Run shell commands
- 📸 **Take Screenshot** - Capture screen
- 📁 **File Operations** - Create, read, write files
- 📧 **Send Email** - Send email notifications
- ⏱️ **Wait/Delay** - Add delays between steps
- ❓ **If/Condition** - Conditional workflow branching
- ✓ **End** - Workflow completion

**Canvas Interaction**
- Drag nodes from palette to canvas
- Reposition nodes by dragging
- Click "Connect" button to create connections
- Visual bezier curves show workflow flow
- Arrow indicators on connections

**Properties Panel**
- Configure node parameters (URLs, commands, etc.)
- View node position and ID
- Delete individual nodes
- Real-time parameter updates

**Execution & Monitoring**
- Click "Execute" to run workflows
- View execution logs in real-time
- Color-coded success/error messages
- Node count and connection statistics

### Usage Example

1. **Add Nodes**: Drag "Start Trigger" and "Open Browser" from left panel
2. **Configure**: Click "Open Browser" node, enter URL in properties
3. **Connect**: Click "Connect" on start node, click browser node to link
4. **Execute**: Type workflow name, click "Execute" button
5. **Monitor**: Watch execution log for results

### Workflow Statistics
- **Nodes Count**: Total nodes in workflow
- **Connections Count**: Total connections between nodes
- All updates shown in real-time

---

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

## Task Scheduling

### Overview
MomoBot includes an integrated **task scheduler** that allows you to automate recurring tasks using cron expressions.

### Features

**Cron Expression Support**
- Standard cron format: `minute hour day month weekday`
- Examples:
  - `0 9 * * *` - Every day at 9:00 AM
  - `0 */4 * * *` - Every 4 hours
  - `0 0 * * 0` - Every Sunday at midnight
  - `30 2 * * 1-5` - Every weekday at 2:30 AM

**Schedule Management UI**
- Create schedules via Task Creator (Step 4)
- View all active schedules in dashboard
- Pause/resume schedules
- Delete schedules
- Track execution history

**Execution Tracking**
- Real-time execution logs
- Success/failure notifications
- Retry on failure with exponential backoff
- Email notifications on completion

**Schedule Status Monitoring**
- Next scheduled run time
- Last execution result
- Execution count
- Average execution duration

### Usage Example

1. **Create Task**: Design your automation in Task Creator
2. **Add Schedule**: In Step 4, select frequency and time
3. **Verify**: Check "Next Run" shows correct timing
4. **Monitor**: Dashboard shows schedule execution history
5. **Adjust**: Edit schedule or disable if needed

### API Endpoints

```bash
# Create schedule
POST /api/schedules
{
  "taskId": "task-123",
  "cronExpression": "0 9 * * *",
  "enabled": true
}

# Get all schedules
GET /api/schedules

# Get schedule by ID
GET /api/schedules/:id

# Update schedule
PUT /api/schedules/:id

# Delete schedule
DELETE /api/schedules/:id

# Get execution history
GET /api/schedules/:id/executions
```

---

## AI-Driven Process Optimization

MomoBot now includes an intelligent optimization engine that analyzes workflow execution patterns and suggests improvements. The system learns from user feedback to continuously refine recommendations.

### 🎯 Key Capabilities

**Workflow Analysis & Optimization**
- Identify bottleneck nodes slowing down execution
- Detect parallelization opportunities (tasks that can run concurrently)
- Suggest schedule optimizations based on execution patterns
- Calculate workflow risk scores and reliability metrics

**Schedule Intelligence**
- Detect time conflicts between scheduled tasks
- Suggest task consolidation to reduce resource overhead
- Analyze 24-hour load distribution
- Identify reliability patterns and suggest fixes

**Learning System**
- Collects user feedback on optimization suggestions
- Tracks which optimization types are most effective
- Adapts recommendations based on approval rate
- Generates insights and trend analysis

### 📊 Real-World Example

**Scenario**: Daily ETL pipeline takes 2 hours; some tasks could be parallel

```
1. System analyzes 100+ executions
   ├─ Detects: "Data validation" and "Caching" have no dependencies
   ├─ Suggests: "Run in parallel to save 35% execution time"
   └─ Confidence: High (similar patterns work 73% of the time)

2. User approves optimization
   ├─ Workflow updated (nodes reordered)
   ├─ Execution time drops to 78 minutes
   └─ User confirms effectiveness

3. System learns this pattern
   ├─ Records approval + time savings
   ├─ Increases confidence level
   └─ Recommends similar optimizations more aggressively
```

### 🔄 Visual Workflow System (n8n-style)

Create complex workflows using a drag-and-drop interface:

**Node Types**:
- **Start/End**: Workflow entry and exit points
- **Task**: Execute any automation task
- **Condition**: Branch workflow based on decision
- **Webhook**: Call external APIs
- **Notification**: Send alerts via email/Slack
- **Delay**: Wait for specified duration

**Approval Gates**:
- Submit workflows for admin review before execution
- Admin can approve, reject, or request modifications
- Full audit trail of all approvals

**Real-time Visualization**:
- See execution plan before starting
- Watch nodes execute in real-time
- View performance metrics per node

### 📈 Dashboard & Metrics

```
GET /api/optimizations/dashboard

Response:
{
  "overview": {
    "activeSchedules": 24,
    "pendingOptimizations": 7,
    "appliedOptimizations": 156,
    "learningEffectiveness": "High"
  },
  "scheduleHealth": {
    "totalConflicts": 3,
    "consolidationOpportunities": 5,
    "reliabilityIssues": 1
  },
  "learningMetrics": {
    "totalEvaluated": 52,
    "approvalRate": "73%",
    "topRecommendations": [...]
  }
}
```

### 🚀 Using AI Optimizations

**Analyze a workflow:**
```bash
curl -X POST http://localhost:4000/api/optimizations/workflows/wf-123/analyze \
  -H "Authorization: Bearer $TOKEN"
```

**Get optimization suggestions:**
```bash
curl http://localhost:4000/api/optimizations/workflows/wf-123/suggestions \
  -H "Authorization: Bearer $TOKEN"
```

**Analyze all schedules:**
```bash
curl http://localhost:4000/api/optimizations/schedules/analyze \
  -H "Authorization: Bearer $TOKEN"
```

**Record feedback on optimization:**
```bash
curl -X POST http://localhost:4000/api/optimizations/opt-123/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"approved": true, "feedback": "Saved 3 min per execution!"}'
```

**View learning report:**
```bash
curl http://localhost:4000/api/optimizations/learning/report \
  -H "Authorization: Bearer $TOKEN"
```

### 📚 Learn More

For complete documentation on the AI optimization system, including:
- API endpoints reference
- Database schema details
- Advanced usage patterns
- Integration examples

See: [AI Optimization Guide](./server/src/features/AI_OPTIMIZATION_GUIDE.md)

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

