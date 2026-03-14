# AI-Powered Task Creator Guide

## Overview

The Task Creator is a comprehensive admin tool that allows you to:
- Create tasks for specific agents with full control
- Get AI recommendations (Claude, GPT, free models)
- Visualize workflows in N8N format
- Execute tasks with complete transparency
- Control everything an agent can do

## Features

### 1. **Agent Capabilities**

Every agent can perform these actions:

| Capability | Icon | Description | Parameters |
|-----------|------|-------------|-----------|
| Shell Command | 💻 | Execute terminal commands | command, timeout, cwd |
| Read File | 📖 | Read file contents | path, encoding |
| Write File | ✍️ | Write/modify files | path, content, append |
| Screenshot | 📸 | Capture screen | format, quality |
| System Info | 🖥️ | Get system details | (none) |
| Check Email | 📧 | Monitor emails | folder, max_results |
| Process List | ⚙️ | List running processes | filter |

### 2. **AI Analysis Integration**

Choose from multiple AI models:

**Premium Models** (require API keys):
- Claude 3 Opus (Anthropic) - Best reasoning
- GPT-4O (OpenAI) - Most capable
- GPT-4 Turbo (OpenAI) - Balanced
- GPT-3.5 Turbo (OpenAI) - Fast

**Free Models** (no API key needed):
- Llama 2 70B (Meta)
- Mistral 7B (Mistral AI)
- Local models (if running llama.cpp/ollama)

#### AI Analysis Shows:
- **Thinking Process**: See how AI reasons about your task
- **Step-by-Step Plan**: What the agent will do
- **Parameters**: Recommended settings
- **Risk Assessment**: Potential issues
- **Time Estimate**: How long it will take

### 3. **Workflow Visualization**

Every task generates an N8N-compatible workflow:

```
┌─────────┐     ┌──────────┐     ┌──────────┐
│  Start  │──→  │   Task   │──→  │ Complete │
└─────────┘     └──────────┘     └──────────┘
                 (parameters)
                 (description)
```

Features:
- Visual workflow diagram
- Node-based flow representation
- Raw JSON format for integration
- Export-ready N8N workflow

### 4. **Command Preview**

See exactly what command will be executed:

```
/shell --command="ls -la /home/user" --timeout="30000"
```

Perfect for validation before execution.

## How to Use

### Step 1: Select Agent & Task Type

1. Go to **Task Creator** in the admin portal
2. **Select Agent**: Choose which agent will execute the task
   - Green dot = Agent is online and ready
   - Red dot = Agent is offline

3. **Select Task Type**: Pick what you want the agent to do
   - Click on a capability from the sidebar
   - Or use the dropdown menu

### Step 2: Configure Task

1. **Write Description**: Describe what you want in natural language
   - "Check the Downloads folder for PDF files"
   - "List all running processes with 'chrome' in name"
   - "Take a screenshot and save it to Desktop"

2. **Set Parameters**: Fill in specific values
   - Path: `/path/to/file`
   - Command: `ls -la`
   - Folder: `INBOX`
   - etc.

### Step 3: Get AI Recommendations (Optional)

1. **Select AI Model**: Choose a model
   - Recommended: Claude Opus (best reasoning)
   - Fast: GPT-3.5 Turbo (quick analysis)
   - Free: Llama 2 or Mistral

2. **Click "Get AI Recommendations"**
   - AI analyzes your task
   - Shows thinking process
   - Suggests parameters
   - Identifies risks

3. **Review Analysis**
   - Click to expand thinking details
   - Adjust parameters if needed

### Step 4: Review Workflow

1. **Click "Generate Workflow"**
   - View N8N workflow visualization
   - See the command preview
   - Verify everything looks correct

2. **Raw JSON View**
   - Expand "Raw JSON Format"
   - Copy for integration with other tools
   - Fully compatible with N8N

### Step 5: Execute Task

1. **Click "Execute Task"**
   - If agent is online: Task executes immediately
   - If agent is offline: Task queues for when agent comes online

2. **Monitor in Dashboard**
   - Watch execution progress
   - See real-time results
   - View final output

## Example Workflows

### Example 1: File Monitoring

**Task**: Monitor Downloads folder for new PDFs

```
Step 1: Select Agent → Agent: MyPC (🟢)
Step 2: Select Task Type → Read File
Step 3: Description: "List all PDF files in Downloads folder"
Step 4: Parameters:
  - path: /home/user/Downloads
  - encoding: utf-8
Step 5: Get AI Recommendations → Shows suggested command
Step 6: Execute → Agent lists files and returns results
```

### Example 2: System Health Check

**Task**: Check system resources

```
Step 1: Agent → MainServer (🟢)
Step 2: Task Type → System Info
Step 3: Description: "Get CPU, memory, and disk usage"
Step 4: No parameters needed
Step 5: AI recommends: Check before running heavy tasks
Step 6: Execute → Returns complete system details
```

### Example 3: Process Management

**Task**: Find and monitor specific process

```
Step 1: Agent → WorkstationA (🟢)
Step 2: Task Type → Process List
Step 3: Description: "Find all chrome processes"
Step 4: Parameters:
  - filter: chrome
Step 5: AI analysis → Suggests killing unresponsive processes
Step 6: Execute → Shows running chrome processes
```

### Example 4: Automated File Operations

**Task**: Create backup of important files

```
Step 1: Agent → BackupAgent (🟢)
Step 2: Task Type → Shell Command
Step 3: Description: "Backup important config files to /backups"
Step 4: Command: "cp -r /etc/config /backups/config-$(date +%s)"
Step 5: AI Recommendations:
   - Plan: Create timestamped backup
   - Risk: Requires elevated permissions
   - Time: ~2-5 seconds
Step 6: Execute → Files backed up with timestamp
```

## Understanding AI Models

### When to Use Each Model

**Claude Opus** (Premium - Best)
- Complex task planning
- High-stakes decisions
- Detailed analysis needed
- Cost: ~$15 per million tokens

**GPT-4O** (Premium - Versatile)
- General purpose tasks
- Fast and reliable
- Good at code generation
- Cost: ~$30 per million tokens

**GPT-3.5 Turbo** (Premium - Fast)
- Quick recommendations
- Simple tasks
- Budget-conscious
- Cost: ~$0.5 per million tokens

**Llama 2** (Free)
- No API key needed
- Good for brainstorming
- Slower than premium models
- Cost: Free via HuggingFace

**Mistral 7B** (Free)
- Lightweight and fast
- Good reasoning
- No API key required
- Cost: Free via HuggingFace

### Setting Up API Keys

Add to your `.env` file:

```bash
# OpenAI (GPT models)
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# HuggingFace (Free models)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx

# Local model endpoint (optional)
LOCAL_MODEL_ENDPOINT=http://localhost:11434/api/generate
```

## Understanding N8N Workflows

The generated workflows follow N8N format:

```json
{
  "name": "Task Workflow",
  "nodes": [
    {
      "id": "trigger",
      "type": "trigger",
      "name": "Start"
    },
    {
      "id": "task_node",
      "type": "action",
      "name": "Shell Command",
      "properties": {
        "taskType": "shell",
        "parameters": {
          "command": "ls -la"
        }
      }
    },
    {
      "id": "response",
      "type": "response",
      "name": "Response"
    }
  ],
  "connections": [
    { "source": "trigger", "target": "task_node" },
    { "source": "task_node", "target": "response" }
  ]
}
```

### Exporting to N8N

1. Generate workflow in Task Creator
2. Click "Raw JSON Format"
3. Copy the JSON
4. Go to N8N editor → Import → Paste JSON
5. Edit and customize as needed
6. Save and deploy

## Advanced Features

### Task History

View recent tasks in the sidebar:
- Task type
- Agent name
- Execution status
- Timestamp

Click to see details and re-run.

### Workflow Templates

Pre-built templates for common tasks:
- System Monitoring
- File Automation
- Email Monitoring
- Shell Automation
- Security Snapshots

Access via: `/api/ai/workflow/templates`

### Workflow Manual Control

You have complete control:
- **Pause**: Pause execution at any time
- **Modify**: Change task mid-execution
- **Cancel**: Stop a running task
- **Retry**: Re-execute failed task
- **Export**: Save as N8N workflow

## Troubleshooting

### Agent Offline
**Problem**: Selected agent shows red dot
**Solution**: 
- Check agent is running
- Verify network connectivity
- Check agent logs for errors
- Task will queue and execute when agent comes online

### AI Analysis Errors
**Problem**: "Failed to get AI analysis"
**Solution**:
- Check API keys in `.env`
- Verify API key has sufficient credits
- Try a free model (Llama 2, Mistral)
- Check internet connectivity

### Workflow Won't Execute
**Problem**: Task stuck in "pending"
**Solution**:
- Verify agent is selected
- Check agent is online
- Review task parameters
- Look at agent logs for errors

### AI Thinking Not Showing
**Problem**: AI recommendations blank
**Solution**:
- Select a task type first
- Write description longer than 10 characters
- Choose available model
- Check API tokens/quota

## Best Practices

✅ **DO:**
- Always review AI recommendations before executing
- Test complex tasks on a test agent first
- Use detailed descriptions for better AI analysis
- Monitor execution in real-time
- Keep audit logs of all tasks

❌ **DON'T:**
- Execute tasks on production without testing
- Use commands without understanding them
- Ignore AI risk warnings
- Run high-privilege commands casually
- Execute unknown scripts

## API Reference

### Create Task with AI Analysis

```bash
POST /api/tasks/create
Content-Type: application/json
Authorization: Bearer {token}

{
  "agent_id": "agent-id-here",
  "type": "shell",
  "description": "List all files in home directory",
  "parameters": {
    "command": "ls -la ~"
  },
  "ai_model": "claude-opus",
  "ai_thinking": "AI analysis text...",
  "workflow": { /* workflow JSON */ }
}
```

**Response:**
```json
{
  "success": true,
  "taskId": "task-id-here",
  "status": "dispatched",
  "message": "Task dispatched to agent"
}
```

### Get AI Recommendations

```bash
POST /api/ai/think
Content-Type: application/json
Authorization: Bearer {token}

{
  "model": "claude-opus",
  "taskType": "shell",
  "description": "Check disk usage",
  "capabilities": ["command", "timeout", "cwd"]
}
```

**Response:**
```json
{
  "success": true,
  "thinking": "AI analysis text...",
  "model": "claude-opus",
  "provider": "Anthropic",
  "tokens": 250
}
```

### Generate Workflow

```bash
POST /api/ai/workflow/generate
Content-Type: application/json

{
  "taskType": "shell",
  "params": { "command": "ls -la" },
  "description": "List home directory"
}
```

**Response:**
```json
{
  "success": true,
  "workflow": { /* workflow object */ },
  "n8nFormat": "{ /* JSON string */ }"
}
```

## Support

For issues or questions:
- Check agent logs: `tail -f agent.log`
- Review API response errors
- Test with simpler tasks first
- Check GitHub Issues: https://github.com/atulpokharel-gp/momobot/issues

---

**Happy automating!** 🚀
