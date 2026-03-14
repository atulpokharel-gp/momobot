# 🚀 Workflow Builder v2.2 - Quick Start Guide (5 Minutes)

## 🎯 What's New?

1. **Full-Page Canvas** - Canvas extends to full page with pan & zoom like draw.io
2. **Custom Task Types** - Save workflows as reusable tasks  
3. **Task Creator Integration** - Use custom workflows in Task Creator
4. **Better Controls** - Zoom buttons, pan support, agent selector

---

## ⚡ 5-Minute Setup

### Step 1: Start Your Servers
```bash
# Terminal 1: Backend
cd server
npm start

# Terminal 2: Frontend  
cd client
npm run dev
```

### Step 2: Open Workflow Builder
```
http://localhost:3000/workflow-builder
```

### Step 3: You're Ready!
✅ Full-page canvas visible  
✅ Zoom controls visible (top right)  
✅ Can drag/pan with right-click  

---

## 🎮 How to Use

### Zoom Canvas
```
Ctrl + Mouse Wheel    = Zoom in/out
Click 🔍−/🔍+        = Manual zoom
Click ⌖ Reset        = Back to 100%
```

### Pan Canvas
```
Right-click + Drag   = Pan canvas
Ctrl + Left-click    = Alternative pan
```

### Create Workflow
```
1. Open left panel
2. Drag nodes to canvas
3. Click nodes and use ports to connect
4. Configure properties in right panel
5. Select agent from dropdown
```

### Save as Custom Task Type
```
1. Create workflow (5+ nodes)
2. Click "⭐ Save as Task Type"
3. Fill icon, name, description
4. Click Save
5. Custom task type created!
```

### Use in Task Creator
```
1. Go to Task Creator
2. Click Task Type dropdown
3. Scroll to "⭐ Custom Workflows"
4. Select your custom task
5. Workflow auto-loads
6. Create task as normal
```

---

## 🧪 Quick Test (2 Minutes)

### Test Zoom
```
1. Open Workflow Builder
2. Hold Ctrl, scroll mouse wheel up/down
3. Observe zoom % increases/decreases
4. Click "⌖ Reset" - back to 100%
✅ Zoom works!
```

### Test Pan
```
1. Create 2 nodes
2. Right-click on empty canvas and drag right
3. Nodes move right (panned)
4. Right-click and drag left
5. Nodes move left
✅ Pan works!
```

### Test Custom Task Type
```
1. Create 5-node workflow
2. Click "⭐ Save as Task Type"
3. Enter: icon=📧, name="Email Workflow"
4. Click Save
5. Success toast appears
6. Open Task Creator
7. See custom task in dropdown
✅ Custom tasks work!
```

---

## 📋 Common Tasks

### Zoom to See Entire Workflow
```
Click "⌖ Reset" → Zooms to 100%, pans to origin
```

### Move Around Large Canvas
```
Right-click and drag = Pan canvas
Or: Hold Ctrl + Left-click and drag
```

### Configure Shell Command
```
1. Add Shell Node
2. Click node to select
3. Right panel → Command input
4. Enter: echo "Hello World"
5. Set Timeout: 30 seconds
6. Select agent from header dropdown
```

### Create Task from Custom Workflow
```
1. TaskCreationPage (Task Creator)
2. Task Type dropdown → "⭐ Custom Workflows"
3. Select your custom task
4. Workflow definition auto-loads
5. Select agent, click Execute
```

---

## 🔗 API Endpoints (For Developers)

### Create Custom Task Type
```bash
POST /api/task-types
{
  "type": "custom_email",
  "name": "Email Workflow",
  "icon": "📧",
  "workflow_definition": {...}
}
```

### List Custom Task Types
```bash
GET /api/task-types/custom
```

### Get Single Task Type
```bash
GET /api/task-types/custom/:id
```

### Update Task Type
```bash
PUT /api/task-types/:id
{
  "name": "Updated Name",
  "icon": "🚀"
}
```

### Delete Task Type
```bash
DELETE /api/task-types/:id
```

---

## ✅ Verification Checklist

- [ ] Servers running (backend + frontend)
- [ ] Workflow Builder page loads (http://localhost:3000/workflow-builder)
- [ ] Zoom controls visible in top right
- [ ] Grid background visible on canvas
- [ ] Can Ctrl+Scroll to zoom
- [ ] Can right-click drag to pan
- [ ] Can create nodes by clicking buttons
- [ ] Can connect nodes
- [ ] Can select agent from dropdown (top)
- [ ] Can save workflow as custom task type
- [ ] Custom task appears in Task Creator dropdown
- [ ] Can create task from custom workflow

**All checked?** ✅ **You're ready to go!**

---

## 📚 Next Steps

### Learn More:
- Full Guide: `WORKFLOW_BUILDER_ENHANCED.md`
- Quick Reference: `WORKFLOW_BUILDER_QUICK_SUMMARY.md`
- Documentation: `DOCUMENTATION_INDEX.md`

### Deploy to Production:
- Guide: `DEPLOYMENT_GUIDE_v2.2.md`
- Testing: `TESTING_VERIFICATION_v2.2.md`

### Troubleshooting:
See `DEPLOYMENT_GUIDE_v2.2.md` → Troubleshooting section

---

## 🎯 Key Features at a Glance

| Feature | Keyboard | Mouse | Button |
|---------|----------|-------|--------|
| Zoom In | Ctrl+↑ | Ctrl+Scroll ↑ | 🔍+ |
| Zoom Out | Ctrl+↓ | Ctrl+Scroll ↓ | 🔍− |
| Reset Zoom | - | - | ⌖ |
| Pan | Ctrl+Drag | Right+Drag | - |
| Create Node | - | Click | Node buttons |
| Connect | - | Click ports | - |
| Delete | - | ✕ button | - |
| Save Task Type | - | - | ⭐ |

---

## 🚀 That's It!

You now have:
- ✅ Full-page, pannable, zoomable canvas
- ✅ Custom task type save/load
- ✅ Task Creator integration
- ✅ Agent assignment
- ✅ Real-time validation

**Start creating workflows!** 🎉

---

**Quick Start Guide v2.2**  
**Last Updated:** March 13, 2025  
**Read Time:** 5 minutes  
**Setup Time:** 5 minutes
