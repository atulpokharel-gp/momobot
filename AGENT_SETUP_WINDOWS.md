# 🚀 MomoBot Local Agent - Windows Setup Guide

## ⚡ Quick Start (5 mins)

### Step 1: Install Node.js
If you don't have Node.js installed:

**Option A: Download from Website**
1. Visit: https://nodejs.org/
2. Download **LTS version** (v18 or v20 recommended)
3. Run installer, accept defaults
4. Restart your computer

**Option B: Using Package Manager**
```powershell
# Using Chocolatey (if installed)
choco install nodejs

# Or using Scoop
scoop install nodejs
```

**Verify Installation:**
```cmd
node --version
npm --version
```

### Step 2: Setup MomoBot Agent

**Double-click one of these files:**
- `INSTALL_AGENT_WINDOWS.bat` (Recommended - Easiest)
- `INSTALL_AGENT_WINDOWS.ps1` (PowerShell version)

Or manually:
```cmd
cd momobot-platform\momobot-agent
npm install
npm start
```

✅ You should see: **Connected to MomoBot server**

---

## 🔧 Troubleshooting

### Error: "npm is not recognized"

**Solution:** Node.js is not installed or not in PATH

1. **Download Node.js:**
   - https://nodejs.org/ → LTS Version
   
2. **Install Node.js:**
   - Run installer
   - Check "Add to PATH" during installation
   - Restart computer
   
3. **Verify:**
   ```cmd
   node --version
   npm --version
   ```

### Error: "Cannot find module 'socket.io-client'"

**Solution:** Dependencies not installed

```cmd
cd momobot-agent
npm install
npm start
```

### Error: "AGENT_API_KEY and AGENT_SECRET_KEY must be set"

**Solution:** .env file is missing or incomplete

1. Check `momobot-agent/.env` exists
2. Verify it contains:
   ```
   AGENT_ID=...
   AGENT_API_KEY=...
   AGENT_SECRET_KEY=...
   SERVER_URL=http://localhost:4000
   ```

### Agent Keeps Disconnecting

**Solutions:**
1. Ensure server is running: `cd server && npm start`
2. Check firewall: Allow Node.js through Windows Firewall
3. Verify SERVER_URL in .env is correct
4. Check logs in `momobot-agent/logs/` folder

---

## 📁 File Structure

```
momobot-platform/
├── INSTALL_AGENT_WINDOWS.bat     ← Quick installer
├── START_AGENT.bat               ← Easy launcher
├── INSTALL_AGENT_WINDOWS.ps1     ← PowerShell setup
├── momobot-agent/
│   ├── .env                      ← Configuration
│   ├── package.json
│   ├── src/
│   │   ├── index.js             ← Main agent
│   │   └── tasks/
│   │       ├── shell.js
│   │       ├── systemInfo.js
│   │       ├── email.js
│   │       └── ...
│   └── logs/                     ← Agent logs
├── server/                        ← Backend server
└── client/                        ← Frontend UI
```

---

## 🚀 Starting the Agent

### Option 1: Double-Click (Easiest)
```
START_AGENT.bat
```
Opens console window with agent running

### Option 2: Command Line
```cmd
cd momobot-agent
npm start
```

### Option 3: Background Service (Windows)
```cmd
cd momobot-agent
node src/install-service.js
```
Then manage from Services app

### Option 4: Task Scheduler (Auto-start)
1. Press `Win + R` → `taskschd.msc`
2. Right-click "Task Scheduler Library"
3. Create Basic Task:
   - Name: "MomoBot Agent"
   - Trigger: At startup
   - Action: Start program
   - Program: `C:\Windows\System32\cmd.exe`
   - Arguments: `/c "C:\path\to\START_AGENT.bat"`
4. ✅ Agent will auto-start when you boot

---

## ✅ Verify Agent is Running

Look for these messages in console:

```
✅ Connected to MomoBot server
System info sent: COMPUTERNAME (win32)
📋 Task received: [shell] whoami
```

If you see ✅ **Connected**, agent is working!

---

## 🔌 Port Requirements

Make sure these ports are available:
- **4000** - Backend server
- **3000** - Frontend UI
- **3001** - Socket.IO connections

Check if port is in use:
```powershell
netstat -ano | findstr :4000
```

Kill process using port:
```powershell
taskkill /PID <PID> /F
```

---

## 📊 Agent Capabilities

Once connected, the agent can:

- ✅ Execute shell commands
- ✅ Get system information
- ✅ Monitor processes
- ✅ Take screenshots
- ✅ Read/write files
- ✅ Check email (with IMAP config)
- ✅ Open browser & navigation
- ✅ Play YouTube videos

All controlled from the MomoBot dashboard.

---

## 🐛 Debug Mode

Run with debug logging:
```cmd
cd momobot-agent
set LOG_LEVEL=debug
npm start
```

Check logs:
```cmd
cd momobot-agent/logs
dir
type agent.log
```

---

## 🛡️ Security Notes

1. **API Keys:** Keep .env file private
2. **Firewall:** Allow Node.js in Windows Firewall
3. **Network:** Only connect to trusted servers
4. **Tokens:** Don't share SERVER_URL or API keys

---

## 📝 Environment Variables

Edit `momobot-agent/.env`:

```env
# Agent Identity
AGENT_ID=d235fe2f-655a-4280-9ead-89b3b6811e41
AGENT_API_KEY=bot_847f3421b652ee34c050c692ee42becc623c8b7abe7c43f8
AGENT_SECRET_KEY=c65009e27d57f8e8a56b36d19708c440eb1080c603b0fc10099d71ad4c131038

# Server Connection
SERVER_URL=http://localhost:4000

# Behavior
LOG_LEVEL=info
HEARTBEAT_INTERVAL=30000
RECONNECT_DELAY=5000
MAX_RECONNECT_ATTEMPTS=100

# Email (Optional)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASSWORD=your-password
```

---

## 💡 Pro Tips

1. **Keep Running:** Let agent run 24/7 for best results
2. **Auto-Start:** Use Task Scheduler to start on boot
3. **Logs:** Check logs folder for troubleshooting
4. **Updates:** Run `npm update` monthly
5. **Firewall:** If behind corporate firewall, whitelist localhost:4000

---

## 🆘 Support

### Agent Status Check
```cmd
tasklist | findstr node
```

### View Running Processes
```powershell
Get-Process node
```

### Kill Agent (if needed)
```powershell
taskkill /F /IM node.exe
```

### Full System Restart
1. Stop all node processes
2. Close all windows
3. `npm start` in momobot-agent folder

---

## 📦 Files Included

| File | Purpose |
|------|---------|
| `INSTALL_AGENT_WINDOWS.bat` | Quick setup & install |
| `START_AGENT.bat` | Easy launcher shortcut |
| `INSTALL_AGENT_WINDOWS.ps1` | PowerShell installer |
| `AGENT_SETUP_WINDOWS.md` | This guide |

---

## ✨ Next Steps

1. ✅ Install Node.js
2. ✅ Run INSTALL_AGENT_WINDOWS.bat
3. ✅ See "Connected to MomoBot server"
4. ✅ Use agent from MomoBot dashboard

**That's it! Agent is ready to use.** 🎉

---

**Last Updated:** March 13, 2026  
**Version:** 1.0.0  
**Platform:** Windows (7+)
