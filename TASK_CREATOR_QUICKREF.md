# Task Creator System - Quick Reference

## 🚀 Quick Start

### 1. Access Task Creator
```
Admin Portal → Sidebar → ✨ Task Creator
```

### 2. Create a Task in 3 Steps

**Step 1: Configure**
```
Agent: [Select your agent] 🟢
Task Type: [Choose capability]
Description: [What you want to do]
Parameters: [Optional specific values]
```

**Step 2: Get AI Help (Optional)**
```
AI Model: [Claude / GPT / Free]
Click: "Get AI Recommendations" ✨
Review: AI thinking and suggestions
```

**Step 3: Execute**
```
Click: "Generate Workflow"
Click: "Execute Task"
Done! ✅
```

## 📊 What Each Capability Does

| Icon | Name | What It Does | Example |
|------|------|-------------|---------|
| 💻 | Shell | Run terminal commands | `ls -la`, `grep`, `find` |
| 📖 | Read File | Read file contents | Read config, logs, data |
| ✍️ | Write File | Create/edit files | Backup, config updates |
| 📸 | Screenshot | Capture screen | Visual monitoring |
| 🖥️ | System Info | Get system stats | CPU, RAM, disk info |
| 📧 | Email | Check emails | Monitor inbox |
| ⚙️ | Process | List processes | Find running apps |

## 🤖 AI Models Available

### Premium (Need API Key)
- **Claude Opus** - Best reasoning, $15/M tokens
- **GPT-4O** - Most capable, $30/M tokens  
- **GPT-4 Turbo** - Balanced, $10/M tokens
- **GPT-3.5 Turbo** - Quick, $0.5/M tokens

### Free (No Key Needed)
- **Llama 2** - Fast, via HuggingFace
- **Mistral** - Lightweight, via HuggingFace

## 🔄 Workflow Example

### Example: Check System Health

```
Admin Creates Task:
├─ Agent: MainServer 🟢
├─ Type: System Info
├─ Description: "Check if CPU/memory OK"
│
AI Analysis:
├─ Thinking: "Safe operation, no params needed"
├─ Plan: "Get CPU, RAM, disk usage"
├─ Risk: Low
├─ Time: ~1 second
│
Workflow Generated:
├─ Start
├─ → Get System Info
├─ → Send Results
└─ → Complete
│
Click Execute:
├─ Task sent to agent
├─ Agent executes
├─ Results returned
└─ Show in dashboard ✅
```

## 📝 N8N Workflow Format

Every task generates an N8N-compatible workflow:

```json
{
  "name": "System Health Check",
  "nodes": [
    { "id": "trigger", "type": "trigger", "name": "Start" },
    { "id": "task", "type": "action", "name": "System Info" },
    { "id": "response", "type": "response", "name": "Complete" }
  ],
  "connections": [
    { "source": "trigger", "target": "task" },
    { "source": "task", "target": "response" }
  ]
}
```

### Export to N8N
1. Generate workflow in Task Creator
2. Click "Raw JSON Format"
3. Copy the JSON
4. Go to N8N → Import → Paste
5. Edit and deploy! 🚀

## 🎯 Common Tasks

### 1. File Monitoring
```
Type: Read File
Path: /home/user/Downloads
→ See new files automatically
```

### 2. System Health
```
Type: System Info
(No parameters)
→ Get CPU, RAM, disk status
```

### 3. Process Management
```
Type: Process List
Filter: chrome
→ Find all chrome processes
```

### 4. Backup Automation
```
Type: Shell Command
Command: cp -r /data /backups/data-$(date +%s)
→ Create timestamped backup
```

### 5. Email Monitoring
```
Type: Check Email
Folder: INBOX
Max Results: 10
→ Get latest 10 emails
```

## 🔐 Security Best Practices

✅ DO:
- Review AI recommendations before executing
- Test on non-critical agents first
- Monitor execution in real-time
- Keep audit logs

❌ DON'T:
- Execute commands you don't understand
- Run high-privilege operations casually
- Ignore AI risk warnings
- Skip testing on production

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Agent offline | Wait for agent to come online, task will queue |
| AI not responding | Check API key, try free model |
| Workflow won't generate | Select task type and write description |
| Command not working | Check parameters and syntax |

## 📊 Dashboard Sidebar

The Task Creator sidebar shows:
- **Agent Capabilities** - All 7 available tasks
- **Recent Tasks** - Last 5 executions
- **AI Models** - Available options

Click on any capability to select it!

## 🔌 API Integration

### Create Task with AI
```bash
curl -X POST http://localhost:4000/api/tasks/create \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent-123",
    "type": "shell",
    "description": "Check disk",
    "parameters": {"command": "df -h"},
    "ai_model": "claude-opus"
  }'
```

### Get AI Recommendations
```bash
curl -X POST http://localhost:4000/api/ai/think \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus",
    "taskType": "Shell Command",
    "description": "Check disk usage",
    "capabilities": ["command", "timeout", "cwd"]
  }'
```

## 📈 Performance

- Task creation: <100ms
- AI analysis: 1-5 seconds
- Workflow generation: <50ms
- Execution: Depends on agent

## 💡 Pro Tips

1. **Use Descriptions**: Long, detailed descriptions get better AI recommendations
2. **Try Free Models First**: Test tasks with free models before premium
3. **Review Workflows**: Always check N8N workflow before executing
4. **Monitor Real-time**: Watch execution sidebar for progress
5. **Check History**: Recent tasks sidebar shows what worked before

## 🎓 Learning Path

1. **Start Simple**: Create a System Info task (no parameters needed)
2. **Try AI**: Use free model to get recommendations
3. **Add Parameters**: Try file read/write tasks
4. **Use Shell**: Create simple shell commands
5. **Advanced**: Combine multiple tasks in workflows

## 📚 Documentation

- **Full Guide**: `TASK_CREATOR_GUIDE.md`
- **Implementation**: `AI_TASK_CREATOR_IMPLEMENTATION.md`
- **This File**: `TASK_CREATOR_QUICKREF.md`

## ✨ What Makes It Special

- 🤖 **AI-Powered**: Claude, GPT-4, or free models
- 📊 **Visual Workflows**: N8N-compatible diagrams
- 🎯 **Full Control**: See exactly what will happen
- 🔄 **Flexible**: Works with all agent capabilities
- 🚀 **Fast**: Deploy tasks in seconds
- 🔐 **Secure**: Authentication + audit logging
- 📈 **Scalable**: Works with any number of agents

---

**Ready to create your first task? Go to Task Creator now!** 🚀
