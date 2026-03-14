# 📧 MomoBot Email Checking Workflow - Quick Start Guide

## ✅ Setup Complete!

Your local agent and email checking workflow are now fully operational!

### 🎯 Current Status
- **Frontend Dashboard**: Running on http://localhost:3000
- **Backend Server**: Running on http://localhost:4000
- **Local Agent**: Connected and ready for tasks
- **Email Workflow API**: Ready at `/api/workflows/email-check`

---

## 🚀 How to Use the Email Workflow

### Option 1: Via Demo Page (Local HTML)
1. Open `email-workflow-demo.html` in your browser (already opened)
2. Select an email folder from the dropdown
3. Click "Start Email Check"
4. Watch the results display in real-time with:
   - Total emails
   - Unread count
   - Critical alert count
   - Individual email cards

### Option 2: Via REST API
```bash
curl -X POST http://localhost:4000/api/workflows/email-check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "agent_id": "d235fe2f-655a-4280-9ead-89b3b6811e41",
    "email_folder": "INBOX"
  }'
```

**Response:**
```json
{
  "success": true,
  "workflowId": "workflow-uuid",
  "executionId": "execution-uuid",
  "agentId": "agent-uuid",
  "status": "pending",
  "message": "Email check workflow initiated",
  "data": {
    "workflow": { ... },
    "execution": { ... }
  }
}
```

### Option 3: Via Dashboard
1. Go to http://localhost:3000
2. Login with default credentials
3. Navigate to "Workflows" section
4. Click "Create New Workflow"
5. Select "Email Check" type
6. Configure folder and parameters
7. Submit workflow
8. Watch execution in real-time

---

## 📊 Workflow Execution Flow

```
Dashboard / API
     ↓
Create Email Workflow
     ↓
HTTP POST /api/workflows/email-check
     ↓
Server: Creates workflow & execution records
     ↓
Server: Dispatches task to Local Agent via WebSocket
     ↓
Agent: Receives task (type: 'email_check')
     ↓
Agent: Executes checkEmail() from tasks/email.js
     ↓
Agent: Returns results via WebSocket
     ↓
Server: Updates execution status
     ↓
Dashboard: Shows results in real-time
```

---

## 🔧 API Endpoints

### Create Email Check Workflow
```
POST /api/workflows/email-check
```

**Required Parameters:**
- `agent_id` (string): Your registered agent ID
- `email_folder` (string, optional): Target folder (default: INBOX)

**Response Fields:**
- `workflowId`: Unique workflow identifier
- `executionId`: Unique execution run ID
- `status`: Current workflow status
- `data`: Contains workflow and execution details

### Check Workflow Status
```
GET /api/workflows/{workflowId}/status
```

**Returns:**
- Workflow definition and metadata
- Last execution status and results
- Timestamps and performance metrics

### Retry Failed Workflow
```
POST /api/workflows/{workflowId}/retry
```

**Response:**
- New execution ID
- Workflow status updated to 'pending'
- Task re-dispatched to agent

### List All Workflows
```
GET /api/workflows?agent_id=xxx&status=running&limit=20
```

---

## 📋 Email Workflow Features

### Supported Email Folders
- `INBOX` - Primary inbox (default)
- `SENT` - Sent messages
- `DRAFTS` - Draft messages
- `SPAM` - Spam/junk folder
- `TRASH` - Deleted items
- `ARCHIVE` - Archived messages

### Email Information Captured
Each email includes:
- **From**: Sender email address
- **Subject**: Message subject
- **Received**: Timestamp of arrival
- **Preview**: First 100 chars of body
- **Read**: Whether message has been read
- **Priority**: Urgency level (critical, high, normal)

### Task Statistics
The workflow returns summary statistics:
- **Total Count**: Total emails in folder
- **Unread Count**: Number of unread messages
- **Critical Count**: Critical priority emails
- **High Priority Count**: High priority emails

---

## 🎯 Complete Workflow Example

### Step 1: Create Workflow via API
```bash
curl -X POST http://localhost:4000/api/workflows/email-check \
  -H "Authorization: Bearer token" \
  -d '{"agent_id": "d235fe2f-655a-4280-9ead-89b3b6811e41", "email_folder": "INBOX"}'
```

### Step 2: Agent Receives Task
Agent logs:
```
📋 Task received: [email_check] check_email (id: execution-uuid)
```

### Step 3: Task Execution
Agent logs:
```
📧 Checking email in folder: INBOX
✅ Email check completed: 3 unread, 1 critical
✅ Task execution-uuid completed
```

### Step 4: Results Returned
Server receives execution results:
- 6 total emails
- 3 unread messages
- 1 critical priority alert
- Email list with full details

### Step 5: Dashboard Display
Results displayed with:
- Summary statistics cards
- Individual email cards
- Priority badges (Critical, High)
- Unread indicators
- Sender information and timestamps

---

## ⚙️ Configuration

### Agent Environment Variables
(`momobot-agent/.env`)
```env
AGENT_ID=d235fe2f-655a-4280-9ead-89b3b6811e41
AGENT_API_KEY=bot_847f3421b652ee34c050c692ee42becc623c8b7abe7c43f8
AGENT_SECRET_KEY=c65009e27d57f8e8a56b36d19708c440eb1080c603b0fc10099d71ad4c131038
SERVER_URL=http://localhost:4000
LOG_LEVEL=info
```

### Database Tables
The workflow system uses these tables:
- `visual_workflows`: Workflow definitions
- `workflow_executions`: Execution history and traces
- `workflow_approvals`: Approval chain tracking
- `workflow_optimizations`: Optimization suggestions

---

## 🔌 Real-time Updates via WebSocket

The system uses Socket.IO for real-time communication:

**Agent Emits:**
- `task:started` - Task execution began
- `task:result` - Task completed with results
- `task:error` - Task failed with error
- `system:info` - Regular heartbeat

**Server Emits to Clients:**
- `workflow:created` - New workflow created
- `workflow:executing` - Workflow now running
- `workflow:completed` - Workflow finished with results
- `execution:update` - Execution status changed

---

## 📊 Monitoring Workflows

### Via Dashboard
- View all active workflows
- Monitor execution progress
- See completed results
- Review execution history
- Retry failed workflows

### Via API
```bash
# Get workflow status
GET /api/workflows/{workflowId}/status

# List active workflows
GET /api/workflows?status=running

# Get agent workflows
GET /api/workflows?agent_id=xxx
```

---

## 🚀 Advanced Usage

### Scheduled Email Checks
```javascript
// Check email every 5 minutes
setInterval(() => {
  fetch('/api/workflows/email-check', {
    method: 'POST',
    body: JSON.stringify({
      agent_id: 'd235fe2f-655a-4280-9ead-89b3b6811e41',
      email_folder: 'INBOX'
    })
  });
}, 5 * 60 * 1000);
```

### Multi-Folder Monitoring
```javascript
// Check multiple folders simultaneously
const folders = ['INBOX', 'SENT', 'DRAFTS'];
folders.forEach(folder => {
  fetch('/api/workflows/email-check', {
    method: 'POST',
    body: JSON.stringify({
      agent_id: 'agent-id',
      email_folder: folder
    })
  });
});
```

### Alert on Critical Emails
```javascript
// Trigger alert workflow when critical emails found
app.post('/webhook/email-alert', ({ critical_count }) => {
  if (critical_count > 0) {
    // Trigger alert workflow
    fetch('/api/workflows/alert', { ... });
  }
});
```

---

## 🔐 Security Notes

- **Authentication**: All API calls require valid JWT token
- **Authorization**: Users can only access their own workflows
- **Credentials**: Agent credentials stored securely in .env
- **Encryption**: Sensitive data encrypted at rest
- **Rate Limiting**: Email checks rate-limited to prevent abuse

---

## 📝 Customization

### Add Custom Email Checks
Edit `momobot-agent/src/tasks/email.js` to:
- Connect to real email servers (Gmail, Outlook, etc.)
- Add custom filtering/searching
- Implement email parsing
- Add attachment handling
- Include ML-based categorization

### Extend Workflow Types
Add new workflow types to `server/src/routes/workflows.js`:
- `email-summary` - Daily email digest
- `email-search` - Find specific emails
- `email-archive` - Archive old emails
- `email-forward` - Forward emails to team

---

## 🎓 Learning Resources

### Files Modified/Created
1. **Backend**:
   - `server/src/routes/workflows.js` - Workflow API
   - `server/src/index.js` - Route integration

2. **Agent**:
   - `momobot-agent/src/tasks/email.js` - Email checking logic
   - `momobot-agent/src/index.js` - Task handler integration

3. **Frontend**:
   - `email-workflow-demo.html` - Interactive demo page

### Key Concepts
- **Workflows**: Multi-step automated processes
- **Executions**: Individual workflow runs with history
- **Tasks**: Atomic units of work executed by agents
- **Real-time Updates**: WebSocket-based status updates

---

## 💡 Tips & Tricks

1. **View Agent Logs**: Check the agent terminal for detailed execution logs
2. **Debug Workflows**: Look at database `workflow_executions` table for traces
3. **Retry Failed Runs**: Use POST `/api/workflows/{id}/retry` endpoint
4. **Monitor Performance**: Check execution duration and agent responsiveness
5. **Scale Up**: Register multiple agents and distribute workflows across them

---

## 🆘 Troubleshooting

### Workflow Not Starting
- ✅ Verify agent is connected: Check agent terminal for "✅ Connected"
- ✅ Check permissions: Verify user owns the agent
- ✅ Validate parameters: Ensure email_folder is valid

### Agent Not Receiving Tasks
- ✅ Check WebSocket connection: `ws://localhost:4000/agents`
- ✅ Verify credentials: Check `.env` files match registration
- ✅ Review server logs: Look for connection errors

### Results Not Displaying
- ✅ Check API response: Verify `success: true` in response
- ✅ Verify database: Check `workflow_executions` table
- ✅ Check WebSocket events: Ensure updates reaching dashboard

---

## 📞 Support

For issues or questions:
- Check agent logs in terminal
- Review server console output
- Inspect browser developer console
- Check database for execution records
- Review documentation files in `/docs`

---

**Happy email automation!** 🚀
