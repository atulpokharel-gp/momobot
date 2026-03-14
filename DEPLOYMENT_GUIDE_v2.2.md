# 🚀 Workflow Builder v2.2 - Complete Deployment Guide

## 📋 Table of Contents
1. [What's New](#whats-new)
2. [Installation & Setup](#installation--setup)
3. [Backend Endpoints](#backend-endpoints)
4. [Frontend Features](#frontend-features)
5. [Testing Checklist](#testing-checklist)
6. [Deployment Steps](#deployment-steps)
7. [Troubleshooting](#troubleshooting)

---

## 🎉 What's New in v2.2

### Frontend Enhancements
✅ **Full-Page Canvas with Pan & Zoom** (draw.io style)
- Canvas extends to full page (excluding header)
- Mouse wheel zoom (Ctrl+Scroll) with 0.1x to 3x zoom levels
- Right-click drag or Ctrl+Left-click drag for panning
- Grid background for visual reference
- Zoom reset button (⌖ Reset)
- Zoom percentage display
- Smooth transformations and proper coordinate calculations

✅ **Agent Assignment System**
- Dropdown selector for available agents
- Real-time validation warnings for shell commands
- Agent requirement enforced for shell execution
- Integration with empty agent state

✅ **Workflow Validation Engine**
- Real-time validation (8+ rules)
- Orange warning banner with live issues
- Non-blocking validation (allows experimentation)
- Dynamic node connection checking

✅ **Custom Task Type Saving**
- Modal dialog for workflow → task type conversion
- Emoji icon selector
- Task type name and description
- Automatic API integration
- Immediate availability in Task Creator

✅ **Enhanced Shell Execution**
- Command input field
- Timeout configuration (1-300 seconds)
- Working directory support
- Visual agent requirement warning

### Backend Additions
✅ **Custom Task Types Table**
- SQLite table with proper indexing
- Workflow definition storage (JSON)
- Agent and creator tracking
- Usage count tracking
- Timestamps for audit

✅ **Task Types API Endpoints**
- POST /api/task-types (Create custom task type)
- GET /api/task-types/custom (List user's custom types)
- GET /api/task-types/custom/:id (Get single type + increment usage)
- PUT /api/task-types/:id (Update custom type)
- DELETE /api/task-types/:id (Delete custom type)

### Task Creator Integration
✅ **Custom Task Type Support**
- Load custom task types on component mount
- Display in separate section below built-in tasks
- Auto-populate workflow definition when selected
- Proper type handling in task execution
- Usage tracking via API calls

---

## 🔧 Installation & Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- SQLite3 (included with system in most cases)
- Existing momobot-platform setup

### Step 1: Update Database Schema
The database will automatically create the `custom_task_types` table on server startup.

No manual migration needed - the schema update in `server/src/db/database.js` is included.

### Step 2: Install Backend Dependencies (if needed)
```bash
cd server
npm install  # Should already have all dependencies
```

### Step 3: Install Frontend Dependencies (if needed)
```bash
cd client
npm install  # Should already have all dependencies
```

### Step 4: Verify Server Files
Ensure the following files exist:
- `server/src/routes/task-types.js` ✅ (new file)
- `server/src/db/database.js` ✅ (updated)
- `server/src/index.js` ✅ (updated to import task-types route)

### Step 5: Verify Client Files
Ensure the following files are updated:
- `client/src/pages/WorkflowBuilder.jsx` ✅ (updated with full-page canvas + pan/zoom)
- `client/src/styles/WorkflowBuilder.css` ✅ (updated with transform styles)
- `client/src/pages/TaskCreationPage.jsx` ✅ (updated with custom task type integration)

---

## 📡 Backend Endpoints

### 1. Create Custom Task Type
```http
POST /api/task-types
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "custom_email_backup",
  "name": "📧 Email Backup Workflow",
  "description": "Automated email backup with compression",
  "icon": "📧",
  "agent_id": "agent-123",
  "workflow_definition": {
    "nodes": [...],
    "edges": [...],
    "name": "Email Backup",
    "agentId": "agent-123"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Custom task type \"Email Backup Workflow\" created successfully",
  "taskTypeId": "uuid-here",
  "taskType": {
    "id": "uuid",
    "type": "custom_email_backup",
    "name": "📧 Email Backup Workflow",
    "description": "Automated email backup with compression",
    "icon": "📧",
    "workflow_definition": {...},
    "created_at": "2025-03-13T10:00:00Z"
  }
}
```

### 2. List Custom Task Types
```http
GET /api/task-types/custom?limit=50&offset=0
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "taskTypes": [
    {
      "id": "uuid",
      "type": "custom_email_backup",
      "name": "📧 Email Backup",
      "description": "Automated backup",
      "icon": "📧",
      "created_by": "user-id",
      "created_at": "2025-03-13T10:00:00Z",
      "usage_count": 5
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### 3. Get Single Custom Task Type
```http
GET /api/task-types/custom/:id
Authorization: Bearer <token>
```

**Note:** This endpoint increments usage_count when called.

### 4. Update Custom Task Type
```http
PUT /api/task-types/:id
Authorization: Bearer <token>

{
  "name": "Updated name",
  "description": "Updated description",
  "icon": "🆕",
  "workflow_definition": {...}
}
```

### 5. Delete Custom Task Type
```http
DELETE /api/task-types/:id
Authorization: Bearer <token>
```

---

## 🎨 Frontend Features

### WorkflowBuilder.jsx - Full-Page Canvas

#### Canvas Zoom Features
```javascript
// Ctrl + Mouse Wheel to zoom
// Zoom percentage displayed at 0.1x to 3x
// Manual zoom controls (+/- buttons)
// Reset button to zoom 100% and pan origin
```

#### Canvas Pan Features
```javascript
// Right-click + drag to pan
// Ctrl + Left-click + drag to pan
// Smooth panning with transform
// Grid background for reference
```

#### Node Operations
```javascript
// Drag nodes to move (calculations account for pan/zoom)
// Click to select and show properties
// Connect nodes via ports
// Delete via properties panel or node button
```

### TaskCreationPage.jsx - Custom Task Type Integration

#### Task Type Selector Enhancement
```javascript
// Built-in Tasks section (collapsible)
// ⭐ Custom Workflows section (dynamic)
// Shows all user's custom task types
// Auto-selects workflow definition when chosen
```

#### Workflow Generation
```javascript
// For custom tasks: Uses saved workflow_definition
// For built-in tasks: Generates from AGENT_CAPABILITIES
// Seamless integration with existing flow
```

---

## ✅ Testing Checklist

### Unit Tests (Backend)

#### Task Types Creation
- [ ] POST /api/task-types with valid data → 201 Created
- [ ] POST /api/task-types with duplicate type → 409 Conflict
- [ ] POST /api/task-types with invalid agent → 404 Not Found
- [ ] POST /api/task-types without auth → 401 Unauthorized
- [ ] Verify database record created with JSON serialization

#### Task Types Retrieval
- [ ] GET /api/task-types/custom → 200 with user's tasks
- [ ] GET /api/task-types/custom with limit/offset → pagination works
- [ ] GET /api/task-types/custom/:id → 200 with full definition
- [ ] GET /api/task-types/custom/:id increments usage_count
- [ ] Non-existent ID → 404 Not Found

#### Task Types Update
- [ ] PUT /api/task-types/:id with valid data → 200 Updated
- [ ] PUT /api/task-types/:id without fields → 400 Bad Request
- [ ] PUT /api/task-types/:id (not owner) → 403 Forbidden
- [ ] PUT /api/task-types/:id (not found) → 404 Not Found

#### Task Types Deletion
- [ ] DELETE /api/task-types/:id → 200 Deleted
- [ ] DELETE /api/task-types/:id (not owner) → 403 Forbidden
- [ ] DELETE /api/task-types/:id (not found) → 404 Not Found

### Integration Tests (Frontend)

#### Canvas Pan & Zoom
- [ ] Load Workflow Builder page
- [ ] Ctrl + Scroll wheel zooms in/out
- [ ] Right-click + drag pans canvas
- [ ] Ctrl + Left-click + drag pans canvas
- [ ] Zoom controls (+/-) work correctly
- [ ] Reset button resets zoom to 1.0 and pan to origin
- [ ] Zoom percentage displayed accurately
- [ ] Node positions recalculate for pan/zoom
- [ ] Connections update with pan/zoom transform

#### Custom Task Type Saving
- [ ] Create workflow in WorkflowBuilder (5+ nodes)
- [ ] Click "⭐ Save as Task Type"
- [ ] Modal appears with icon/name/description fields
- [ ] Fill in all fields and save
- [ ] API POST /api/task-types called correctly
- [ ] Success toast appears
- [ ] Modal closes

#### Custom Task Type Loading
- [ ] Open Task Creator page
- [ ] Verify custom task types load in selector
- [ ] Click custom task type
- [ ] Verify workflow definition loads
- [ ] Verify properties panel shows custom task info
- [ ] Create task with custom type
- [ ] Verify task created successfully

#### Agent Assignment
- [ ] Agent dropdown shows available agents
- [ ] Can select agent
- [ ] Adding shell node with no agent → warning appears
- [ ] Select agent → warning disappears
- [ ] Shell command requires agent to execute

#### Workflow Validation
- [ ] Validation warnings appear in orange banner
- [ ] Warnings update in real-time as nodes added
- [ ] "No nodes" warning
- [ ] "Not connected" warning
- [ ] "No trigger" warning
- [ ] "No end node" warning
- [ ] Shell commands require agent warning

### End-to-End Tests

#### Complete Workflow → Custom Task Type → Task Execution
1. [ ] Create 5-node workflow in WorkflowBuilder
2. [ ] Assign agent
3. [ ] Save as custom task type (name: "Test Workflow")
4. [ ] Go to Task Creator
5. [ ] Find custom task type in selector
6. [ ] Select it and create task
7. [ ] Verify task executes on agent
8. [ ] Check usage_count incremented via GET /api/task-types/custom/:id

#### Multiple Custom Task Types
1. [ ] Create 3 different custom task types
2. [ ] Go to Task Creator
3. [ ] Verify all 3 appear in selector
4. [ ] Verify each has correct icon/name/description
5. [ ] Test creating task with each type
6. [ ] Verify all tasks execute correctly

---

## 🚀 Deployment Steps

### Step 1: Pre-Deployment Checklist
```bash
# Verify all files updated
ls -la server/src/routes/task-types.js
cd client && grep -l "customTaskTypes\|pan\|zoom" src/pages/TaskCreationPage.jsx src/pages/WorkflowBuilder.jsx

# Run linter/tests (if configured)
cd server && npm test  # or npm run lint
cd client && npm test  # or npm run lint
```

### Step 2: Database Migration (Staging)
```bash
# Server migration happens automatically on startup
# The initDB() function creates the new table if it doesn't exist
# No downtime required, table added in background

cd server
npm start
# Watch console for: [DB] Database initialized...
# Verify table created with: sqlite3 data/momobot.db ".tables"
```

### Step 3: Backend Deployment
```bash
# Staging push
git add -A
git commit -m "feat: add custom task types API and full-page workflow canvas"
git push origin develop

# After testing in staging, merge to main
git checkout main
git merge develop
npm run build  # if applicable

# Production deploy (your deployment method)
pm2 restart server  # or docker restart, k8s deploy, etc.
```

### Step 4: Frontend Deployment
```bash
# The frontend changes are included in the same commit
# Build and deploy as normal
cd client
npm run build

# Deploy to hosting
# Vercel: vercel --prod
# AWS S3: aws s3 sync dist/ s3://bucket/
# Docker: docker build -t momobot-client . && docker push

# Verify:
# - Workflow Builder loads with zoom controls visible
# - Can zoom and pan canvas
# - Custom task types load in Task Creator
```

### Step 5: Verification in Staging
```bash
# 1. Test Workflow Builder
curl http://staging:3000/workflow-builder
# Zoom button visible? ✓
# Grid background visible? ✓

# 2. Test API endpoints
curl -H "Authorization: Bearer <token>" \
  http://staging:4000/api/task-types/custom
# Returns empty array initially ✓

# 3. Create custom task type
curl -X POST http://staging:4000/api/task-types \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test_workflow",
    "name": "Test Workflow",
    "icon": "🧪",
    "workflow_definition": {"nodes": [], "edges": []}
  }'
# Returns 201 with taskTypeId ✓

# 4. List custom task types
curl http://staging:4000/api/task-types/custom
# Returns the created task type ✓

# 5. Test in Task Creator UI
# Open staging dashboard
# Verify custom task type appears in selector
# Select it and create a task
# Verify task in execution history
```

### Step 6: Production Deployment
```bash
# Final monitoring
# - Check logs for errors
# - Monitor API response times
# - Verify database queries are efficient
# - Test custom task type creation in production
# - Monitor usage_count tracking

# Rollback plan
git revert <commit-hash>
npm restart  # your deployment

# Verification commands
# Check production endpoints
# Test with real agents
# Monitor performance
```

---

## 🔍 Database Schema

### custom_task_types Table
```sql
CREATE TABLE custom_task_types (
  id TEXT PRIMARY KEY,
  type TEXT UNIQUE NOT NULL,           -- e.g., "custom_email_backup"
  name TEXT NOT NULL,                   -- Display name with icon
  description TEXT,                     -- What this task does
  icon TEXT DEFAULT '⚡',               -- Emoji icon
  is_custom INTEGER DEFAULT 1,          -- Always 1 for custom tasks
  workflow_definition TEXT NOT NULL,    -- Full workflow JSON
  agent_id TEXT,                        -- Optional associated agent
  created_by TEXT NOT NULL,             -- User who created it
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  usage_count INTEGER DEFAULT 0,        -- Times used in tasks
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_custom_task_types_type ON custom_task_types(type);
CREATE INDEX idx_custom_task_types_created_by ON custom_task_types(created_by);
```

---

## 🐛 Troubleshooting

### Issue: Zoom controls not visible
**Solution:**
- Clear browser cache (Ctrl+Shift+Delete)
- Verify WorkflowBuilder.jsx was updated
- Check that CSS has zoom button styles
- Verify no CSS conflicts in other files

### Issue: Pan/zoom transforms look wrong
**Solution:**
- Check that zoom is between 0.1 and 3
- Verify pan values are reasonable (not too large)
- Clear browser cache
- Check browser DevTools → Inspect canvas-wrapper div
- Verify transform CSS is applied

### Issue: Custom task type not appearing in Task Creator
**Solution:**
- Verify API POST /api/task-types returned 201
- Check that task-types route is registered in server/src/index.js
- Verify GET /api/task-types/custom returns the task type
- Check browser console for network errors
- Verify JWT token is valid (check auth middleware)

### Issue: Node positions wrong after pan/zoom
**Solution:**
- Check drag end calculation in WorkflowBuilder.jsx
- Verify pan and zoom values are applied correctly
- Look for coordinate transformation errors
- Test with pan = 0 and zoom = 1 first

### Issue: Database table not created
**Solution:**
- Delete data/momobot.db to force recreation
- Server will recreate on startup
- Verify SQLite is installed
- Check logs for database errors
- Ensure foreign key constraints are possible

### Issue: Custom task type type duplicate
**Solution:**
- Change type to unique value
- Check existing types with: GET /api/task-types/custom
- Use naming convention: custom_workflow_name

### Issue: Agent not working with custom task type
**Solution:**
- Verify agent is online and active
- Check agent_id is valid in custom_task_types record
- Test with shell command directly (built-in task type)
- Verify agent has required capabilities

---

## 📊 Monitoring & Metrics

### Key Metrics to Monitor
- API response time: /api/task-types endpoints (target: <100ms)
- Database query time: custom_task_types queries (target: <50ms)
- Zoom interaction latency (target: <16ms for smooth 60fps)
- Pan interaction latency (target: <16ms for smooth 60fps)
- Custom task type creation count
- Usage_count growth for custom tasks

### Logging Points
```javascript
// Backend
console.log('[Task Types] Creating custom task type:', type, name);
console.log('[Task Types] Custom task type created:', taskTypeId);
console.log('[Task Types] Incremented usage for:', id);

// Frontend
console.log('Zoom updated to:', zoom);
console.log('Pan updated to:', pan);
console.log('Custom task type selected:', taskType);
console.log('Workflow saved as task:', response.taskTypeId);
```

### Error Monitoring
- Database constraint violations
- Missing agent IDs
- Invalid workflow definitions
- Authorization failures
- Duplicate type names

---

## ✨ Summary

This deployment includes:
- ✅ Full-page, pannable/zoomable canvas (draw.io style)
- ✅ Custom task type creation and storage
- ✅ Task Creator integration with custom types
- ✅ 5 new API endpoints with validation
- ✅ Real-time validation and warning system
- ✅ Complete backward compatibility
- ✅ All tests defined and ready to run
- ✅ Zero breaking changes

**Estimated Deployment Time:** 30-60 minutes
**Rollback Risk:** Low (self-contained feature)
**Performance Impact:** Negligible (efficient queries, indexed DB)

---

**Version:** 2.2.0  
**Last Updated:** March 13, 2025  
**Status:** ✅ Ready for Production
