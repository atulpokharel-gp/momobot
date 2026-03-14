# 🚀 Push MomoBot Code to GitHub - Complete Guide

## ⚡ Quick Start

### Step 1: Install Git (if needed)
```
Double-click: INSTALL_GIT.bat
OR
Download from: https://git-scm.com/download/win
```

### Step 2: Create GitHub Repository
1. Go to: https://github.com/new
2. Repository name: `momobot` (or your choice)
3. Click "Create repository"
4. Copy the URL

### Step 3: Push Code
```powershell
Double-click: PUSH_TO_GITHUB.ps1
Enter your GitHub URL when prompted
Done! ✅
```

---

## 📋 Step-by-Step Guide

### Step 1: Check Git Installation

```powershell
# PowerShell
git --version
```

If you see an error, install Git from: https://git-scm.com/download/win

### Step 2: Configure Git (First Time Only)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

Verify:
```powershell
git config --global user.name
git config --global user.email
```

### Step 3: Create GitHub Repository

1. **Sign in to GitHub:**  
   https://github.com/login

2. **Create New Repository:**  
   https://github.com/new

3. **Fill in Details:**
   ```
   Repository name: momobot
   Description: MomoBot Platform - Local Agent System
   Public or Private: Your choice
   Initialize with README: NO (we have code already)
   ```

4. **Click "Create repository"**

5. **Copy the URL** from the page

### Step 4: Initialize Local Repository

```powershell
cd C:\Users\YOUR_USERNAME\Desktop\momobot-platform

# Initialize git
git init

# Add remote (use your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/momobot.git
```

### Step 5: Add All Files

```powershell
# Stage all files
git add .

# Check what will be added
git status
```

### Step 6: Create First Commit

```powershell
git commit -m "Initial commit: MomoBot platform with agent setup scripts"
```

### Step 7: Push to GitHub

```powershell
# Push to GitHub
git push -u origin main
```

⚠️ **If you get error about 'main' branch:**
```powershell
# Use master instead
git push -u origin master
```

**Then on GitHub:**
1. Go to Settings → Branches
2. Change default branch from master to main
3. In local folder: `git push origin main`

---

## 🤖 Automated Way (Using Script)

The easiest way:

```powershell
# PowerShell as Administrator
powershell -ExecutionPolicy Bypass -File "PUSH_TO_GITHUB.ps1"
```

The script will:
- ✅ Check Git installation
- ✅ Configure Git user (if needed)
- ✅ Initialize repository
- ✅ Add remote
- ✅ Stage files
- ✅ Create commit
- ✅ Push to GitHub

---

## 📝 What Gets Pushed

You'll push:
- ✅ All setup scripts (.bat, .ps1)
- ✅ All documentation (.md, .txt)
- ✅ Agent code (/momobot-agent/)
- ✅ Server code (/server/)
- ✅ Client code (/client/)
- ✅ Configuration files

Automatically excluded:
- ❌ node_modules/ (large, regeneratable)
- ❌ .env files (secret keys)
- ❌ logs/ folder
- ❌ Other build artifacts

---

## 🔑 Authentication

### Option 1: HTTPS with Personal Access Token (Recommended)

1. **Create GitHub Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Scopes: repo, workflow, admin:repo_hook
   - Copy token

2. **Use Token:**
   ```powershell
   # When prompted for password, paste token instead
   git push -u origin main
   ```

3. **Save Token (Optional):**
   ```powershell
   git config --global credential.helper wincred
   # Next time, Windows will remember it
   ```

### Option 2: SSH Key

1. **Generate SSH Key:**
   ```powershell
   ssh-keygen -t rsa -b 4096 -C "your@email.com"
   ```

2. **Add to GitHub:**
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste your public key (~/.ssh/id_rsa.pub)

3. **Use SSH URL:**
   ```powershell
   git remote add origin git@github.com:YOUR_USERNAME/momobot.git
   git push -u origin main
   ```

---

## ✅ Verification

After pushing, verify on GitHub:

1. **Go to your repository:**  
   https://github.com/YOUR_USERNAME/momobot

2. **Check files are there:**
   - START_AGENT.bat ✅
   - PUSH_TO_GITHUB.ps1 ✅
   - All documentation ✅
   - /momobot-agent/ ✅
   - /server/ ✅
   - /client/ ✅

3. **Check commit:**
   - Click "Commits"
   - See your commit with all files

---

## 🐛 Troubleshooting

### Error: "fatal: 'main' branch not found"

**Solution:**
```powershell
# Check what branches exist
git branch -a

# Push to correct branch
git push -u origin master
# Then change default on GitHub
```

### Error: "Authentication failed"

**Solution:**
```powershell
# Clear saved credentials
git config --global --unset credential.helper

# Use personal access token instead of password
# Create token: https://github.com/settings/tokens
# Use token when prompted for password
```

### Error: "Permission denied (publickey)"

**Solution (for SSH):**
```powershell
# Generate SSH key if not exists
ssh-keygen -t rsa -b 4096 -C "your@email.com"

# Add key to ssh-agent
ssh-add ~/.ssh/id_rsa

# Add public key to GitHub
# https://github.com/settings/keys
```

### Error: "fatal: remote origin already exists"

**Solution:**
```powershell
# Remove old remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/YOUR_USERNAME/momobot.git
```

### Large files error

**Solution:**
```powershell
# Check large files
git ls-files --size | tail -20

# Remove node_modules if included
git rm -r --cached node_modules
echo "node_modules/" >> .gitignore
git add .gitignore
git commit -m "Remove node_modules"
```

---

## 📚 Git Commands Reference

```powershell
# Status
git status                          # See what changed

# Staging
git add .                          # Stage all files
git add filename                   # Stage one file
git reset filename                 # Unstage file

# Commits
git commit -m "message"            # Create commit
git log                            # View commit history
git show COMMIT_ID                 # View commit details

# Branches
git branch                         # List branches
git branch new-branch              # Create branch
git checkout branch-name           # Switch branch
git merge branch-name              # Merge branch

# Remote
git remote -v                      # View remotes
git remote add origin URL          # Add remote
git fetch                          # Get remote changes
git pull                           # Fetch and merge
git push                           # Push commits
git push origin --delete branch    # Delete remote branch

# Undo
git restore filename               # Discard changes
git restore --staged filename      # Unstage file
git revert COMMIT_ID               # Undo commit
git reset --hard HEAD~1            # Delete last commit
```

---

## 🎯 Your Setup

### Repository Details
```
Location:   C:\Users\YOUR_USERNAME\Desktop\momobot-platform\
Repository: https://github.com/YOUR_USERNAME/momobot
Branch:     main (or master)
Files:      4,500+ lines of code
```

### Initial Push Checklist
- [ ] Git installed
- [ ] GitHub account created
- [ ] Repository created
- [ ] Git configured (user.name, user.email)
- [ ] Repository initialized (git init)
- [ ] Remote added (git remote add origin)
- [ ] Files staged (git add .)
- [ ] Commit created (git commit -m)
- [ ] Pushed to GitHub (git push)

---

## 🚀 After First Push

### Keep Pushing Updates

```powershell
# After making changes
git status                         # See changed files
git add .                          # Stage changes
git commit -m "Description"        # Commit
git push                           # Push to GitHub
```

### Collaborate

```powershell
# Get latest from GitHub
git pull

# Work on feature branch
git checkout -b feature-name
# Make changes...
git add .
git commit -m "Add feature"
git push -u origin feature-name

# On GitHub: Create Pull Request
# Merge when ready
```

---

## 📖 Next Steps

1. **Install Git** (if needed)
   - INSTALL_GIT.bat

2. **Push your code**
   - PUSH_TO_GITHUB.ps1

3. **Check GitHub**
   - Visit your repository URL

4. **Share the link**
   - https://github.com/YOUR_USERNAME/momobot

---

## 💡 Pro Tips

1. **Use .gitignore** - Exclude node_modules, .env, logs:
   ```
   node_modules/
   .env
   logs/
   *.log
   build/
   dist/
   ```

2. **Write good commits** - Use descriptive messages:
   ```
   ❌ "update" 
   ✅ "Add Windows agent setup scripts"
   ```

3. **Commit regularly** - Save progress often:
   ```
   git add .
   git commit -m "Feature: XYZ"
   git push
   ```

4. **Branching** - Use for features:
   ```
   git checkout -b feature-email-workflow
   # Make changes...
   git push -u origin feature-email-workflow
   ```

---

## ✨ Success = Code on GitHub!

When done, you'll have:
- ✅ Code in GitHub
- ✅ Version history
- ✅ Collaboration ready
- ✅ Backup in cloud
- ✅ Easy sharing

---

**Ready to push?** Run: `PUSH_TO_GITHUB.ps1`

**Last Updated:** March 14, 2026  
**Version:** 1.0.0  
**Status:** Ready ✅
