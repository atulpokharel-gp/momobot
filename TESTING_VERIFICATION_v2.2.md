# 🧪 Workflow Builder v2.2 - Complete Testing & Verification Guide

## 📋 Quick Test Checklist

### Pre-Testing Setup
- [ ] Backend server running (`cd server && npm start`)
- [ ] Frontend dev server running (`cd client && npm run dev`)
- [ ] At least 1 test agent available and online
- [ ] User logged in to dashboard
- [ ] Database initialized with custom_task_types table

---

## 🎯 Test Suite 1: Canvas Pan & Zoom (WorkflowBuilder)

### Test 1.1: Page Loads with Zoom Controls
**Expected:** Workflow Builder page loads with zoom controls visible
```
Steps:
1. Navigate to http://localhost:3000/workflow-builder
2. Look for zoom controls in top right of canvas
3. Verify buttons visible: ["🔍−", zoom percentage, "🔍+", "⌖ Reset"]
4. Check for grid background pattern

Expected Result: ✅ All controls visible, grid background present
```

### Test 1.2: Zoom In (Ctrl + Scroll Up)
**Expected:** Canvas zooms in, zoom % increases
```
Steps:
1. Hold Ctrl key and scroll mouse wheel UP
2. Observe zoom percentage near zoom controls
3. Verify nodes appear larger
4. Verify zoom % increases (50% → 60% → 70% etc)
5. Try zoom from 100% to 150%

Expected Result: ✅ Zoom increases by 10% per scroll, nodes enlarge
Test Values: Starts at 100%, max 300%
```

### Test 1.3: Zoom Out (Ctrl + Scroll Down)
**Expected:** Canvas zooms out, zoom % decreases
```
Steps:
1. Hold Ctrl key and scroll mouse wheel DOWN
2. Observe zoom percentage near zoom controls
3. Verify nodes appear smaller
4. Verify zoom % decreases (100% → 90% → 80% etc)
5. Try zoom from 100% to 50%

Expected Result: ✅ Zoom decreases by 10% per scroll, nodes shrink
Test Values: Min 10%, starts at 100%
```

### Test 1.4: Zoom with Plus Button
**Expected:** Plus button zooms in
```
Steps:
1. Click "🔍+" button (top right)
2. Verify zoom increases by 10%
3. Click 15 times
4. Verify zoom caps at 300%
5. Verify zoom % display updates

Expected Result: ✅ Each click increases zoom by 10%, caps at 300%
```

### Test 1.5: Zoom with Minus Button
**Expected:** Minus button zooms out
```
Steps:
1. Click "🔍−" button (top right)
2. Verify zoom decreases by 10%
3. Click 15 times
4. Verify zoom caps at 10%
5. Verify zoom % display updates

Expected Result: ✅ Each click decreases zoom by 10%, caps at 10%
```

### Test 1.6: Zoom Reset Button
**Expected:** Reset button returns to 100% zoom and origin pan
```
Steps:
1. Zoom to 200% (click 🔍+ several times)
2. Pan canvas to right and down
3. Click "⌖ Reset" button
4. Verify zoom returns to 100%
5. Verify canvas pan returns to origin (0, 0)

Expected Result: ✅ Zoom reset to 100%, pan reset to origin
```

### Test 1.7: Right-Click Drag Pan
**Expected:** Right-click and drag pans canvas
```
Steps:
1. Right-click on empty canvas and drag RIGHT
2. Verify canvas moves right (nodes move right)
3. Right-click and drag LEFT
4. Verify canvas moves left (nodes move left)
5. Right-click and drag DOWN, then UP
6. Note: connections and SVG should also pan

Expected Result: ✅ Right-click drag pans canvas smoothly
```

### Test 1.8: Ctrl+Left-Click Drag Pan
**Expected:** Ctrl+Left-click and drag also pans canvas
```
Steps:
1. Hold Ctrl and Left-click canvas, drag RIGHT
2. Verify canvas pans right
3. Hold Ctrl and Left-click, drag different directions
4. Verify panning works in all directions

Expected Result: ✅ Ctrl+Left-click drag pans canvas smoothly
```

### Test 1.9: Node Positions with Pan/Zoom
**Expected:** Node positions calculated correctly after pan/zoom
```
Steps:
1. Create 2 nodes
2. Record node positions (e.g., node1 at 100,100)
3. Zoom to 200%
4. Pan canvas right by 50px
5. Drag node1 to new position (300, 200)
6. Reset zoom and pan
7. Verify node1 is at original adjusted position

Expected Result: ✅ Node drag accounts for pan/zoom transforms
```

### Test 1.10: SVG Connections Pan/Zoom
**Expected:** Connection lines move and scale with pan/zoom
```
Steps:
1. Create 2 nodes and connect them
2. Verify connection line visible
3. Zoom to 150%
4. Verify connection line scales with nodes
5. Pan canvas
6. Verify connection line pans with nodes
7. Reset and pan again
8. Verify connection line pans correctly

Expected Result: ✅ SVG paths transform with pan/zoom
```

### Test 1.11: Zoom During Pan
**Expected:** Zooming while panned maintains correct view
```
Steps:
1. Pan canvas to right (x+=50)
2. Zoom to 150%
3. Verify canvas is still panned
4. Zoom back to 100%
5. Verify pan is maintained

Expected Result: ✅ Pan and zoom are independent transformations
```

### Test 1.12: Cursor Feedback
**Expected:** Cursor changes during pan operations
```
Steps:
1. Hover over empty canvas
2. Cursor should be grab (openhand)
3. Right-click and drag
4. Cursor should change to grabbing (closedhand)
5. Release right-click
6. Cursor returns to grab

Expected Result: ✅ Cursor provides visual feedback
```

---

## 🤖 Test Suite 2: Custom Task Type Creation (WorkflowBuilder)

### Test 2.1: Save as Task Type Modal Opens
**Expected:** Modal appears when clicking "⭐ Save as Task Type"
```
Steps:
1. Create 3+ nodes in workflow
2. Click "⭐ Save as Task Type" button (top right)
3. Verify modal overlay appears
4. Verify modal has 3 input fields: icon, name, description
5. Click Cancel or outside to close
6. Verify modal closes

Expected Result: ✅ Modal opens and closes correctly
```

### Test 2.2: Emoji Icon Selector
**Expected:** Can set task type icon
```
Steps:
1. Open "Save as Task Type" modal
2. Click emoji icon input field
3. Clear default "⚡"
4. Type emoji: "📧", "🔥", "🎯", "🚀"
5. Verify emoji displays correctly
6. Save and verify task type shows correct emoji

Expected Result: ✅ Custom emoji set as task type icon
```

### Test 2.3: Task Type Name Required
**Expected:** Name field is required
```
Steps:
1. Open "Save as Task Type" modal
2. Leave name field empty
3. Try to click Save button
4. Verify error message or button disabled
5. Enter name "Test Task"
6. Verify error gone and save enabled

Expected Result: ✅ Name is required field
```

### Test 2.4: Save Custom Task Type
**Expected:** Saves workflow as custom task type via API
```
Steps:
1. Create 5-node workflow
2. Click "⭐ Save as Task Type"
3. Fill: icon=📊, name="Data Processing", description="Processes data"
4. Click Save
5. Verify success toast: "Data Processing added to Task Creator!"
6. Verify API call in Network tab: POST /api/task-types
7. Verify taskTypeId in response

Expected Result: ✅ Workflow saved as task type
API Response Code: 201 Created
Payload includes workflow_definition with nodes and edges
```

### Test 2.5: Task Type Name Validation
**Expected:** Task type name generates unique type ID
```
Steps:
1. Create task type "Email Backup Workflow"
2. Check API response
3. Verify type field: "custom_email_backup_workflow"
4. Create another: "Data Processing Task"
5. Verify type field: "custom_data_processing_task"

Expected Result: ✅ Type ID auto-generated from name (lowercase, underscores)
```

### Test 2.6: Prevent Duplicate Task Type Names
**Expected:** Cannot save task type with same name twice
```
Steps:
1. Create and save task type "Test Workflow v1"
2. Create different workflow
3. Try to save as "Test Workflow v1" again
4. Verify error: Task type already exists or similar
5. Rename to "Test Workflow v2" and save
6. Verify success

Expected Result: ✅ Duplicate type names prevented
Error Code: 409 Conflict
```

### Test 2.7: Workflow Definition Stored Correctly
**Expected:** Full workflow definition saved with custom task type
```
Steps:
1. Create workflow with 5 nodes, 4 connections
2. Configure node parameters (URLs, commands, etc)
3. Save as custom task type
4. Use API to GET /api/task-types/custom/:id
5. Verify workflow_definition contains:
   - All nodes with positions, types, params
   - All edges with connection info
   - Metadata (name, agentId if selected)

Expected Result: ✅ Complete workflow definition preserved
```

### Test 2.8: Task Type Metadata
**Expected:** Task type stores all metadata
```
Chec k database or API response:
- id: UUID ✓
- type: unique identifier ✓
- name: display name ✓
- icon: emoji ✓
- description: optional ✓
- created_by: user ID ✓
- created_at: timestamp ✓
- usage_count: starts at 0 ✓
- workflow_definition: full JSON ✓

Expected Result: ✅ All fields populated correctly
```

---

## 📋 Test Suite 3: Task Creator Integration

### Test 3.1: Custom Task Types Load in Selector
**Expected:** Custom task types appear in Task Creator selector
```
Steps:
1. Create 2 custom task types in Workflow Builder
2. Navigate to Task Creator (Dashboard → Task Creator)
3. Click Task Type dropdown
4. Verify "⭐ Custom Workflows" section appears
5. Verify both custom task types listed with icons and names

Expected Result: ✅ Custom tasks appear below built-in tasks
```

### Test 3.2: Select Custom Task Type
**Expected:** Can select custom task type from dropdown
```
Steps:
1. Open Task Creator
2. Click Task Type dropdown
3. Click on a custom task type
4. Verify dropdown closes
5. Verify custom task type name shows in selector
6. Verify icon displays

Expected Result: ✅ Custom task type selected correctly
```

### Test 3.3: Workflow Definition Auto-Loads
**Expected:** Selecting custom task type loads its workflow
```
Steps:
1. Open Task Creator
2. Select custom task type
3. Check "N8N Workflow Format" panel
4. Verify workflow nodes show in visualization
5. Verify connections show in diagram
6. Expand "Raw JSON Format" and verify full definition

Expected Result: ✅ Workflow definition loaded and displayed
```

### Test 3.4: Create Task from Custom Type
**Expected:** Can create task using custom task type
```
Steps:
1. Select agent from dropdown
2. Select custom task type
3. Click "Generate Workflow" or auto-generated
4. Click "🎯 Execute Task"
5. Verify task sent to agent
6. Verify success toast
7. Check execution history for task

Expected Result: ✅ Task created successfully
Agent receives workflow definition with custom nodes
```

### Test 3.5: Multiple Custom Task Types
**Expected:** Can work with multiple different custom task types
```
Steps:
1. Create 3 different custom task types (Email, Data, Backup)
2. Go to Task Creator
3. Select Email task type → Create task
4. Go back to Task Creator
5. Select Data task type → Create task
6. Go back and select Backup task type → Create task
7. Check execution history - all 3 tasks created

Expected Result: ✅ All custom task types work independently
```

### Test 3.6: Custom Task Type with Agent
**Expected:** Custom task type respects assigned agent
```
Steps:
1. Create workflow with shell command
2. Assign agent
3. Save as custom task type
4. Go to Task Creator
5. Select custom task type
6. Select different agent from dropdown
7. Create task
8. Verify task sent to selected agent (not assigned one)

Expected Result: ✅ Task Creator agent selection overrides saved agent
```

### Test 3.7: Parameters Editable in Task Creator
**Expected:** Can modify workflow parameters before execution
```
Steps:
1. Create custom task type with configurable fields
2. Go to Task Creator
3. Select custom task type
4. If parameters shown, modify them (edit URLs, commands, etc)
5. Click "🎯 Execute Task"

Expected Result: ✅ Parameters available for modification
```

---

## 🧪 Test Suite 4: Agent Assignment & Validation

### Test 4.1: Agent Dropdown Population
**Expected:** Agents load from API
```
Steps:
1. Open Workflow Builder
2. Look for agent dropdown (top left area)
3. Click dropdown
4. Verify list of agents appears
5. Verify each shows emoji + name (e.g., "🤖 Agent-1")
6. Verify status indicator if available

Expected Result: ✅ All available agents listed
```

### Test 4.2: Select Agent
**Expected:** Can select agent from dropdown
```
Steps:
1. Click agent dropdown
2. Click first agent
3. Verify agent name shows in dropdown
4. Select different agent
5. Verify selection updates

Expected Result: ✅ Agent selection persists
```

### Test 4.3: Shell Command Requires Agent
**Expected:** Shell nodes require agent assignment
```
Steps:
1. Do NOT select agent (leave as "No Agent")
2. Add Shell Command node
3. Verify warning in properties: "⚠️ Assign an agent above..."
4. Verify warning in orange banner: "Shell commands require agent"
5. Select agent from dropdown
6. Verify warning disappears

Expected Result: ✅ Shell command validation working
```

### Test 4.4: Validation Warning Banner
**Expected:** Orange warning banner shows all issues
```
Steps:
1. Create workflow without trigger
2. Add 2 nodes but don't connect them
3. Add shell command without agent
4. Verify orange banner shows 3+ warnings:
   - "⚠️ Workflow has no trigger node"
   - "⚠️ Nodes are not connected"
   - "⚠️ Shell commands require an agent assignment"

Expected Result: ✅ All 3+ warnings visible in banner
```

### Test 4.5: Execute Without Agent (No Shell Commands)
**Expected:** Can execute non-shell workflows without agent
```
Steps:
1. Create workflow with HTTP Request + Response nodes
2. Do not select agent
3. Click "▶️ Execute"
4. Verify workflow executes
5. Check execution log for success

Expected Result: ✅ Non-shell workflows can execute without agent
```

### Test 4.6: Execute with Shell Command Requires Agent
**Expected:** Cannot execute shell workflow without agent
```
Steps:
1. Create workflow with shell command node
2. Do NOT select agent
3. Try to click "▶️ Execute"
4. Verify error: "Shell commands require an agent to be assigned"
5. Select agent
6. Try execute again
7. Verify success

Expected Result: ✅ Shell execution blocked without agent, works with agent
```

---

## 🔌 Test Suite 5: API Endpoint Testing

### Test 5.1: POST /api/task-types (Create)
**curl command:**
```bash
curl -X POST http://localhost:4000/api/task-types \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test_custom_task",
    "name": "🧪 Test Custom Task",
    "description": "A test task type",
    "icon": "🧪",
    "workflow_definition": {
      "nodes": [
        {"id": "node-1", "type": "start", "label": "Start", "x": 0, "y": 0}
      ],
      "edges": [],
      "name": "Test Workflow",
      "agentId": null
    }
  }'
```

**Expected Response:**
- Status: 201 Created
- Body: `{"success": true, "taskTypeId": "uuid", "taskType": {...}}`
- Database: Record created in custom_task_types

### Test 5.2: GET /api/task-types/custom (List)
**curl command:**
```bash
curl http://localhost:4000/api/task-types/custom \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
- Status: 200 OK
- Body: `{"success": true, "taskTypes": [], "pagination": {...}}`
- Shows custom task types created by user

### Test 5.3: GET /api/task-types/custom/:id (Get One)
**curl command:**
```bash
curl http://localhost:4000/api/task-types/custom/TASK_TYPE_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
- Status: 200 OK
- Body: Includes full workflow_definition with nodes/edges
- Database: usage_count incremented by 1

### Test 5.4: PUT /api/task-types/:id (Update)
**curl command:**
```bash
curl -X PUT http://localhost:4000/api/task-types/TASK_TYPE_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "description": "Updated description",
    "icon": "🚀"
  }'
```

**Expected Response:**
- Status: 200 OK
- Body: Updated task type object

### Test 5.5: DELETE /api/task-types/:id (Delete)
**curl command:**
```bash
curl -X DELETE http://localhost:4000/api/task-types/TASK_TYPE_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
- Status: 200 OK
- Body: `{"success": true, "message": "Task type deleted successfully"}`
- Database: Record removed

### Test 5.6: Authorization Check
**Test without token:**
```bash
curl http://localhost:4000/api/task-types/custom
# Expected: 401 Unauthorized
```

### Test 5.7: Validation Errors
**Test duplicate type:**
```bash
# Create task type 1
curl -X POST ...same as 5.1...

# Try to create task type 2 with same "type"
curl -X POST ... (same type field)
# Expected: 409 Conflict
```

---

## ✅ Final Integration Test

### Complete End-to-End Workflow
Follow this exact sequence:

1. **Create Workflow in Workflow Builder**
   - [ ] Navigate to http://localhost:3000/workflow-builder
   - [ ] Create 5 nodes: Start → HTTP Request → Condition → Shell → Response
   - [ ] Configure node properties (URL, command, etc)
   - [ ] Connect all nodes
   - [ ] Verify no validation warnings
   - [ ] Select agent from dropdown

2. **Save as Custom Task Type**
   - [ ] Click "⭐ Save as Task Type"
   - [ ] Set: icon=🔄, name="Full Test Workflow", desc="Complete E2E test"
   - [ ] Click Save
   - [ ] Verify success toast
   - [ ] Verify API response 201

3. **Verify in Task Creator**
   - [ ] Navigate to Task Creator
   - [ ] Open Task Type dropdown
   - [ ] Find custom task type in "⭐ Custom Workflows" section
   - [ ] Verify icon and name correct
   - [ ] Click to select it
   - [ ] Verify workflow definition loads

4. **Create Task from Custom Type**
   - [ ] Select agent from dropdown
   - [ ] Click "🎯 Execute Task"
   - [ ] Verify success toast: "Task created and sent to agent!"
   - [ ] Check execution history
   - [ ] Verify task has custom workflow definition

5. **Verify API Tracking**
   - [ ] Call GET /api/task-types/custom/:id
   - [ ] Verify usage_count incremented (+1 or more)
   - [ ] Verify all fields populated correctly

6. **Test Modification**
   - [ ] Update custom task type via API (PUT /api/task-types/:id)
   - [ ] Change name, icon, or description
   - [ ] Verify update in Task Creator
   - [ ] Create another task
   - [ ] Verify new version used

7. **Cleanup**
   - [ ] Delete custom task type via API (DELETE /api/task-types/:id)
   - [ ] Verify no longer in Task Creator
   - [ ] Verify API returns 404 on subsequent GET

---

## 📊 Test Results Summary

### Test Coverage Metrics
```
Canvas Pan & Zoom:        12 tests
Custom Task Types:        10 tests
Task Creator Integration: 7 tests
Agent Assignment:         6 tests
API Endpoints:            7 tests

Total:                    42 tests
```

### Success Criteria
- [ ] All 42 tests passing
- [ ] No console errors
- [ ] No unhandled promise rejections
- [ ] Database queries complete in <100ms
- [ ] UI responds smoothly (60fps)
- [ ] All API responses within SLA

### Sign-Off
QA Engineer: _________________________ Date: _________
Manager:     _________________________ Date: _________

---

**Test Plan Version:** 2.2.0  
**Last Updated:** March 13, 2025  
**Status:** Ready for Execution
