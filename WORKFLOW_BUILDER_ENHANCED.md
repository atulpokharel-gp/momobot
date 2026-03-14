# 🔗 Enhanced Workflow Builder - Complete Feature Guide

## ✨ What's New (Latest Version)

The Workflow Builder has been completely enhanced with powerful enterprise-grade features for creating, managing, and executing automated workflows.

---

## 📋 Table of Contents

1. [New Features](#new-features)
2. [Getting Started](#getting-started)
3. [Agent Assignment](#agent-assignment)
4. [Shell Command Execution](#shell-command-execution)
5. [Workflow Validation & Warnings](#workflow-validation--warnings)
6. [Save as Task Type](#save-as-task-type)
7. [Execution & Error Handling](#execution--error-handling)
8. [Full API Reference](#full-api-reference)

---

## 🆕 New Features

### 1. **Agent Assignment** 🤖
- **What it does**: Assign agents to execute shell commands and other operations
- **Why it matters**: Enables distributed task execution across multiple agents
- **How to use**:
  - Look at the dropdown next to the workflow name input
  - Select an agent from the list
  - Agent will be used for any shell commands in the workflow
  - Visual warning appears if shell commands lack agent assignment

### 2. **Enhanced Shell Command Execution** ⌨️
The Shell node now supports:
- **Command**: Full shell/terminal commands (Windows PowerShell, Bash, etc.)
- **Timeout**: Set execution timeout (1-300 seconds, default 30)
- **Working Directory**: Specify the directory where command executes
- **Validation**: Automatic warning if no agent assigned

**Example Shell Commands:**
```powershell
# Windows
Get-Process | Select-Object Name, CPU | Format-Table
dir C:\Users /s
tasklist /v

# Linux/Mac
ps aux | grep chrome
ls -la /home/user
curl https://api.example.com/data
```

### 3. **Workflow Validation & Warnings System** ⚠️
Automatic validation checks include:
- ✅ Workflow has at least one trigger node
- ✅ All nodes are connected
- ✅ Workflow has an end node
- ✅ No orphaned nodes
- ✅ Shell commands have agent assignment
- ✅ Minimum viable workflow structure

**Warning Display**: Orange banner at top of canvas shows warnings in real-time

### 4. **Save as Custom Task Type** ⭐
Convert any workflow into a reusable task type for the Task Creator!

**Steps**:
1. Design your workflow with nodes and connections
2. Click "⭐ Save as Task Type" button
3. Fill in the modal:
   - Choose an emoji icon
   - Enter custom task type name
   - Add description (optional)
4. Click "✅ Save as Task Type"

**Result**: Your workflow appears in Task Creator under custom task types

### 5. **Enhanced Error Handling** ❌➡️✅
- Real-time execution logging with detailed error messages
- Error-specific styling (red text for errors)
- Full stack trace information in execution log
- Automatic error detection with user warnings

### 6. **Full-Page Responsive Layout**
- Optimized for large monitors and full-screen usage
- Sidebar resizable and collapsible
- Canvas auto-scales to available space
- Mobile-friendly property panels

---

## 🚀 Getting Started

### Access the Workflow Builder
```
URL: http://localhost:3000/workflow-builder
```

### Basic Workflow Steps
1. **Name Your Workflow**: Type in the workflow name input (top-left)
2. **Assign Agent** (Optional): Select an agent from dropdown
3. **Add Nodes**: Click node buttons in left sidebar
4. **Connect Nodes**: 
   - Click "Connect" button on a node
   - Click another node to create connection
   - Green dashed line shows preview
5. **Configure Properties**: Click each node to edit parameters
6. **Validate**: Check orange warning banner for issues
7. **Execute**: Click "▶️ Execute" to run workflow
8. **Review Log**: Check execution log at bottom for results

---

## 🤖 Agent Assignment

### Why Assign Agents?

Agents handle:
- Shell command execution
- File operations
- System information retrieval
- Browser automation
- Screenshot capture
- And more...

### How to Assign

```javascript
// In Workflow Builder UI:
1. Look for agent dropdown (next to workflow name)
2. Select agent: "🤖 Agent Name"
3. Assignment shows in properties:
   "🤖 Agent: Agent Name"
```

### Agent Requirements

For **Shell Commands**, agents must:
- Be online and connected
- Have shell execution capability
- Have proper permissions for commands

---

## ⌨️ Shell Command Execution

### Node Configuration

When you select a **Shell Command** node:

```
Properties Panel shows:
├── Command (textarea)
│   Example: echo "Hello" & dir C:\
├── Timeout (seconds)
│   Range: 1-300, Default: 30
└── Working Directory (optional)
    Example: C:\Users\username\Desktop
```

### Command Execution Flow

```
[Shell Node] 
    ↓
[Execute Command on Agent]
    ↓
[Capture Output/Error]
    ↓
[Return to Workflow]
    ↓
[Next Node or End]
```

### Success Indicators

✅ **Successful Execution** (Green in log):
```
✅ Shell command executed successfully
stdout: Command output here...
```

❌ **Failed Execution** (Red in log):
```
❌ Execution Failed
Error: Command not found: unknowncommand
Details: /bin/bash: unknowncommand: command not found
```

---

## ⚠️ Workflow Validation & Warnings

### Warning Types

1. **No Nodes Warning**
   ```
   ⚠️ Workflow has no nodes
   ```
   *Resolution*: Add at least one node from the left sidebar

2. **No Trigger Warning**
   ```
   ⚠️ Workflow has no trigger node (Start, Schedule, or Webhook)
   ```
   *Resolution*: Add Start, Schedule, or Webhook node to begin workflow

3. **No End Node Warning**
   ```
   ⚠️ Workflow has no end node
   ```
   *Resolution*: Add End or Return node to conclude workflow

4. **Disconnected Nodes Warning**
   ```
   ⚠️ Nodes are not connected
   ```
   *Resolution*: Connect all nodes using input/output ports

5. **Orphaned Node Warning**
   ```
   ⚠️ Node "Screenshot" is not connected to workflow
   ```
   *Resolution*: Connect the node to the workflow chain

6. **Shell Without Agent Warning**
   ```
   ⚠️ Shell commands require an agent assignment
   ```
   *Resolution*: Select an agent from the agent dropdown

### Validation Timing

- ✅ Validates in **real-time** as you edit
- ✅ Shows in **orange warning banner** at top
- ✅ Updates as you add/remove/connect nodes
- ✅ Prevents execution if critical issues exist

---

## ⭐ Save as Task Type

### Modal Walkthrough

```
╔═══════════════════════════════════════╗
║  💾 Save as Custom Task Type          ║
├═══════════════════════════════════════┤
│ Task Type Icon: [🚀]                  │ (1-2 characters)
│ Task Type Name: [Email Automation]    │ (required)
│ Description: [Auto-verify emails...]  │ (optional)
├───────────────────────────────────────┤
│ Workflow Info:                        │
│ 📝 Name: Email Automation             │
│ 📦 Nodes: 5                           │
│ 🔗 Connections: 4                     │
│ 🤖 Agent: Agent-01                    │
├───────────────────────────────────────┤
│ [Cancel]  [✅ Save as Task Type]      │
╚═══════════════════════════════════════╝
```

### What Happens After Saving?

✅ New task type created with workflow definition
✅ Appears in Task Creator's custom task types
✅ Can be used to create new tasks
✅ Agent assignment preserved

### Example: Email Verification Workflow

```javascript
1. Create workflow:
   Start → AI Agent → Condition → Email → End

2. Configure nodes:
   - AI Agent: "Check if email valid"
   - Condition: "email.isValid === true"
   - Email: Send confirmation

3. Assign Agent: Agent-01

4. Save as Task Type:
   Icon: 📧
   Name: Email Verification
   Description: Verify email addresses with AI

5. Go to Task Creator:
   Select "📧 Email Verification" from task types
   Create task for automation!
```

---

## 🔄 Execution & Error Handling

### Execution Process

```yaml
Step 1: Validation
  └─ Check for critical warnings
  └─ Verify agent assignment (if needed)

Step 2: Prepare Payload
  └─ Package nodes and edges
  └─ Include agent ID
  └─ Add workflow metadata

Step 3: Execute
  └─ Send to server API
  └─ Execute each node sequentially
  └─ Capture output/errors

Step 4: Display Results
  └─ Show execution log
  └─ Display any errors
  └─ Show success message
```

### Execution Log Format

```
✅ Execution Complete
─────────────────────────────────────
node-0: Start node initialized
node-1: AI Agent response: "verification required"
node-2: Condition evaluated: true
node-3: Email sent to recipient@example.com
Result: Successfully completed all steps
```

### Error Recovery

**When Errors Occur**:

1. **Immediate Feedback**: Toast notification shows error
2. **Execution Log**: Displays full error details
3. **Warning System**: Identifies potential issues
4. **No Data Loss**: Workflow remains intact for debugging

**Common Errors & Solutions**:

| Error | Cause | Solution |
|-------|-------|----------|
| Command not found | Wrong command syntax | Check command compatibility |
| Agent offline | Agent disconnected | Reconnect agent first |
| Permission denied | Insufficient permissions | Check file/command permissions |
| Timeout exceeded | Command taking too long | Increase timeout or optimize command |
| Invalid URL | Malformed API endpoint | Verify URL format |

---

## 📡 Full API Reference

### Save Workflow

```javascript
POST /workflows

Request:
{
  "name": "Email Automation",
  "description": "Custom workflow with 5 nodes",
  "agentId": "agent-001",
  "definition": {
    "nodes": [...],
    "edges": [...],
    "metadata": {
      "createdAt": "2026-03-13T...",
      "type": "visual",
      "nodeCount": 5
    }
  }
}

Response:
{
  "success": true,
  "workflowId": "workflow-123",
  "message": "Workflow saved"
}
```

### Save as Task Type

```javascript
POST /task-types

Request:
{
  "type": "custom_email_automation",
  "name": "📧 Email Automation",
  "description": "Auto-verify and process emails",
  "icon": "📧",
  "isCustom": true,
  "workflowDefinition": {
    "name": "Email Automation",
    "nodes": [...],
    "edges": [...],
    "agentId": "agent-001"
  }
}

Response:
{
  "success": true,
  "taskTypeId": "task-type-456",
  "message": "Task type created",
  "customTaskTypes": [...]
}
```

### Execute Workflow

```javascript
POST /workflows/execute

Request:
{
  "workflowName": "Email Automation",
  "agentId": "agent-001",
  "definition": {
    "nodes": [...],
    "edges": [...]
  },
  "startTime": "2026-03-13T15:30:00Z",
  "warnings": [...]
}

Response:
{
  "success": true,
  "results": {
    "node-0": "Started",
    "node-1": "AI response received",
    "node-3": "Email sent"
  },
  "executionLog": [
    "✅ Execution Complete",
    "All nodes executed successfully"
  ],
  "totalTime": "2.34s"
}
```

---

## 📊 Node Types Reference

### Trigger Nodes
- **Start** ▶️: Begin workflow execution
- **Webhook** 🪝: Trigger from web requests
- **Schedule** ⏰: Run at specific times

### AI Nodes
- **AI Agent** 🤖: GPT/Claude powered actions
- **LLM Model** 🧠: Language model inference
- **Embeddings** 📊: Vector embeddings generation

### API & Data Nodes
- **HTTP Request** 🌐: Make HTTP calls
- **API Call** ⚙️: Call REST APIs
- **Database** 🗄️: Database operations
- **JSON Parser** {}: Parse JSON data

### Logic Nodes
- **If/Condition** ❓: Conditional branching
- **Switch** 🔀: Multi-way branching
- **Loop** 🔄: Repeat operations

### Action Nodes
- **Open Browser** 🌐: Launch browser
- **Screenshot** 📸: Capture screen
- **File Ops** 📁: File operations
- **Send Email** 📧: Email sending
- **Shell Command** ⌨️: Execute commands

### Output Nodes
- **Output Parser** 📤: Transform output
- **Return** ✓: Return result
- **End** 🛑: End workflow

---

## 🎯 Best Practices

### Workflow Design

1. **Always Start with Trigger**
   ```
   ✅ Start → Logic → Action → End
   ❌ Logic → Action (missing trigger)
   ```

2. **Connect All Nodes**
   ```
   ✅ Linear chain or branching with condition
   ❌ Orphaned nodes with no connections
   ```

3. **Add Error Handling**
   ```
   ✅ Condition → (Success Path) → End
      └─ (Failure Path) → Error Handler
   ```

4. **Use Descriptive Names**
   ```
   ✅ "Verify Email Address"
   ❌ "node-5"
   ```

### Shell Commands

1. **Test Locally First**
   - Test command in terminal before adding to workflow
   - Verify permissions and path

2. **Handle Errors**
   - Use try-catch equivalents
   - Check exit codes

3. **Optimize Performance**
   - Set reasonable timeouts
   - Minimize external calls
   - Use efficient commands

---

## 🔒 Security Considerations

⚠️ **Important**:
- Shell commands execute with agent permissions
- Validate user input before executing
- Avoid hardcoding sensitive data
- Use environment variables for secrets
- Monitor execution logs for suspicious activity

---

## 📞 Troubleshooting

### Workflow Won't Execute

**Check**:
1. Orange warning banner - fix issues listed
2. Agent assigned and online
3. All nodes have valid configuration
4. Click "▶️ Execute" button available (not grayed out)

### Shell Command Fails

**Check**:
1. Agent is online ("🤖 Agent X" shown in dropdown)
2. Command is valid for the OS (Windows/Linux)
3. Timeout is sufficient
4. Working directory exists
5. Command has required permissions

### Task Type Won't Save

**Check**:
1. Task type name is filled in
2. Workflow has at least one node
3. Icon field not empty
4. No API errors in network tab
5. Sufficient permissions to create task type

### Execution Hangs

**Check**:
1. Agent might be offline
2. Command might not be terminating
3. Increase timeout and retry
4. Check for infinite loops in logic nodes

---

## 📈 Performance Tips

- **Large Workflows**: Keep under 20 nodes per workflow
- **Execution Speed**: Minimize external API calls
- **Memory**: Avoid processing huge files
- **Timeout**: Account for slowest operation + 10%

---

## 🎓 Examples

### Example 1: Simple Email Check Workflow

```
Start
  ↓
[Input: email address]
  ↓
HTTP Request GET/check-email
  ↓
Condition: status === "valid"
  ├─ Yes → Send Email
  └─ No → Log Invalid
  ↓
End
```

### Example 2: System Monitor Workflow

```
Schedule: Every 5 minutes
  ↓
Shell: Get-Process | Measure-Object (count)
  ↓
Condition: count > 100
  ├─ Yes → Alert Email
  └─ No → Log Normal
  ↓
End
```

### Example 3: Data Processing Workflow

```
Webhook: /process-file
  ↓
File Ops: Read CSV file
  ↓
AI Agent: Process with GPT
  ↓
Database: Store results
  ↓
Return: Success message
```

---

## 🚀 What's Next?

- Create your first workflow today
- Save it as a Task Type
- Use it in the Task Creator
- Monitor execution with the task dashboard

**Happy automating! 🎉**

---

**Version**: 2.1.0 (Enhanced)  
**Last Updated**: March 13, 2026  
**Status**: Production Ready ✅
