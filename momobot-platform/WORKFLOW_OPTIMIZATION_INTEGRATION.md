# MomoBot Workflow Optimization System Integration Guide

## System Architecture Overview

The MomoBot platform now includes a complete AI-driven workflow optimization system with three integrated layers:

```
┌─────────────────────────────────────────────────────────────┐
│            Web Dashboard (React Frontend)                    │
│  - Visual workflow designer (drag-drop)                      │
│  - Approval workflow UI                                      │
│  - Optimization suggestions & feedback                       │
│  - Dashboard with metrics & learning reports                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                REST API Layer                                │
├─────────────────────────────────────────────────────────────┤
│ /api/optimizations/                                          │
│   ├─ workflows/{id}/analyze                                  │
│   ├─ workflows/{id}/suggestions                              │
│   ├─ workflows/{id}/optimizations/{id}/apply                 │
│   ├─ schedules/analyze                                       │
│   ├─ schedules/visualization                                 │
│   ├─ schedules/optimizations/{id}/apply                      │
│   ├─ optimizations/{id}/feedback                             │
│   ├─ optimizations/learning/report                           │
│   └─ optimizations/dashboard                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Core Optimization Engines                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │ ProcessOptimizer │         │ScheduleOptimizer │          │
│  ├──────────────────┤         ├──────────────────┤          │
│  │                  │         │                  │          │
│  │ • Bottleneck     │         │ • Conflict       │          │
│  │   detection      │         │   detection      │          │
│  │ • Parallelization│         │ • Consolidation  │          │
│  │   opportunities  │         │   suggestions    │          │
│  │ • Risk scoring   │         │ • Load balancing │          │
│  │ • Critical path  │         │ • Reliability    │          │
│  │   analysis       │         │   analysis       │          │
│  │                  │         │ • Learning system│          │
│  └──────────────────┘         └──────────────────┘          │
│           │                           │                      │
│           └───────────┬───────────────┘                      │
│                       │                                       │
│  ┌────────────────────▼──────────────────┐                 │
│  │   Workflow Builder & Orchestrator     │                 │
│  ├──────────────────────────────────────┤                 │
│  │                                      │                 │
│  │ • Visual node-edge workflow design   │                 │
│  │ • Approval gates (pending/approved)  │                 │
│  │ • Real-time execution visualization │                 │
│  │ • Full execution tracing            │                 │
│  │ • DAG validation & topological sort  │                 │
│  │                                      │                 │
│  └──────────────────────────────────────┘                 │
│                                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Database Layer                                  │
├─────────────────────────────────────────────────────────────┤
│ • visual_workflows                    (Workflow definitions) │
│ • workflow_approvals                  (Approval history)    │
│ • workflow_executions                 (Execution traces)    │
│ • workflow_optimizations              (Applied optimizations)│
│ • schedules                           (Cron jobs)          │
│ • schedule_executions                 (Execution history)  │
│ • schedule_optimizations              (Suggestions)        │
│ • optimization_feedback               (User feedback)      │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. ProcessOptimizer (`server/src/features/processOptimizer.js`)

**Responsibilities:**
- Analyze workflow execution patterns
- Identify performance bottlenecks
- Suggest parallelization opportunities
- Calculate workflow risk scores

**Key Methods:**
```javascript
class ProcessOptimizer {
  // Analyze workflow and generate optimization suggestions
  analyzeWorkflow(workflowId) → { suggestions, stats, criticalPath, riskScore }
  
  // Get nodes that are slower than average
  identifyBottlenecks(nodes, stats) → bottlenecks[]
  
  // Find tasks that can run in parallel
  findParallelizationOpportunities(nodes, edges) → opportunities[]
  
  // Apply optimization (creates request for approval)
  applyOptimization(workflowId, optimizationId) → optimizationRequestId
  
  // Generate comprehensive report
  generateOptimizationReport(workflowId) → report
}
```

**Data Flow:**
```
Workflow Executions (100+)
        │
        ▼
Collect Metrics (duration, success, errors per node)
        │
        ▼
Calculate Statistics (average, min, max, success rate)
        │
        ├──▶ Identify Bottlenecks (nodes > 2x average)
        ├──▶ Find Parallelization (independent tasks)
        ├──▶ Detect Redundancies (duplicate configs)
        └──▶ Suggest Schedule Optimization
        │
        ▼
Return Prioritized Suggestions (high/medium/low)
```

### 2. ScheduleOptimizer (`server/src/features/scheduleOptimizer.js`)

**Responsibilities:**
- Detect conflicts between scheduled tasks
- Suggest task consolidation
- Analyze resource load distribution
- Track optimization effectiveness

**Key Methods:**
```javascript
class ScheduleOptimizer extends EventEmitter {
  // Analyze all active schedules
  analyzeAllSchedules() → { suggestions, scheduleMap, conflicts }
  
  // Detect overlapping schedules
  detectTimeConflicts(schedules) → conflicts[]
  
  // Find tasks in same time window
  findConsolidationOpportunities(schedules) → opportunities[]
  
  // Analyze hourly load
  analyzeResourceUsage(schedules) → optimizations[]
  
  // Apply and track optimization
  applyScheduleOptimization(suggestionId, optimization) → optimizationId
  
  // Record user feedback (approve/reject)
  recordFeedback(optimizationId, approved, feedback) → feedbackId
  
  // Generate learning report
  generateLearningReport() → { approvalRate, effectiveness, recommendations }
}
```

**Task Pattern Analysis:**
```
1. Extract execution windows from cron expressions:
   - "0 2 * * *" → 2:00 AM daily
   - "30 2 * * *" → 2:30 AM daily
   
2. Detect conflicts:
   - Task A: 2:00-2:15 AM
   - Task B: 2:10-2:25 AM
   → Overlap 5 minutes, mutual CPU/memory contention
   
3. Suggest consolidation:
   - Run A + B sequentially: 2:00-2:40 AM
   - Save: 10 minutes overlap/deadlock time
   
4. Track effectiveness:
   - User approves: learning_db logs success
   - System increases confidence for similar patterns
```

### 3. WorkflowBuilder (`server/src/features/workflowBuilder.js`)

**Responsibilities:**
- Create and manage visual workflows
- Handle approval workflow gates
- Store workflow definitions in database

**Key Methods:**
```javascript
class WorkflowBuilder extends EventEmitter {
  // Create new workflow with nodes and edges
  createWorkflow(name, nodes, edges) → { id, status: 'draft' }
  
  // Update workflow definition
  updateWorkflow(workflowId, nodes, edges) → updated
  
  // Validate DAG structure
  validateWorkflow(nodes, edges) → { valid, errors[] }
  
  // Submit for approval
  submitForApproval(workflowId, userId, comment) → approvalId
  
  // Admin approval
  approveWorkflow(approvalId, approverId, notes) → { status: 'active' }
  
  // Reject with feedback
  rejectWorkflow(approvalId, approverId, reason) → { status: 'draft' }
  
  // Export as JSON
  exportWorkflow(workflowId) → JSON
  
  // Import from JSON
  importWorkflow(jsonData) → workflowId
}
```

**Approval Workflow:**
```
┌─────────────┐
│   Draft     │  User creates workflow
└──────┬──────┘
       │ submitForApproval()
       ▼
┌──────────────────┐
│ Pending Approval │  Admin reviews
└──────┬───────────┘
       │
       ├─ approveWorkflow() ──▶ ┌────────┐
       │                       │ Active │  Ready for execution
       │                       └────────┘
       │
       └─ rejectWorkflow() ──▶ ┌───────┐
                               │ Draft │  For modification
                               └───────┘
```

### 4. WorkflowOrchestrator (`server/src/features/workflowOrchestrator.js`)

**Responsibilities:**
- Execute workflows with real-time visualization
- Build and execute DAGs
- Emit execution updates to frontend
- Maintain execution traces

**Key Methods:**
```javascript
class WorkflowOrchestrator extends EventEmitter {
  // Execute complete workflow
  async executeWorkflow(workflowId, variables, initiatedBy) → executionId
  
  // Build execution plan (topological sort)
  buildExecutionPlan(nodes, edges) → nodeIds[] (in execution order)
  
  // Execute individual node
  async executeNode(node, execution, variables) → { status, duration, output }
  
  // Handle different node types
  async executeTask(node, variables) → result
  async evaluateCondition(node, variables) → boolean
  async callWebhook(node, variables) → response
  async sendNotification(node, variables) → sent
  
  // Cancel running execution
  cancelExecution(executionId) → success
  
  // Get full execution history
  getExecutionDetails(executionId) → { trace, nodeStates, duration }
}
```

**Execution Flow:**
```
1. Load workflow definition
   ├─ Parse nodes[] and edges[]
   └─ Validate DAG structure

2. Build execution plan (topological sort)
   ├─ Start node
   ├─ Independent parallel branches
   └─ Sequential dependencies
   └─ End node

3. Execute nodes in order
   ├─ For each node:
   │  ├─ Execute based on type (task/condition/webhook/etc)
   │  ├─ Emit: workflow:node_executed
   │  ├─ Record: duration, output, errors
   │  └─ Update execution_trace
   │
   └─ Emit: workflow:execution_plan (before running)
   └─ Emit: workflow:node_executed (during each node)
   └─ Emit: workflow:completed (at end)

4. Store execution history
   ├─ Save to workflow_executions table
   ├─ Full trace: [{ nodeId, duration, output }, ...]
   └─ Node states: { nodeId: { status, output, error } }

5. Trigger optimization analysis
   └─ After X executions, ProcessOptimizer analyzes patterns
```

## Integration Points

### 1. API Routes Integration

**File**: `server/src/routes/optimizations.js`

```javascript
// Mounts all optimization endpoints
setupOptimizationRoutes(db, scheduler, EventEmitter)
  │
  ├─▶ POST /workflows/:id/analyze
  │   └─ Uses ProcessOptimizer.analyzeWorkflow()
  │
  ├─▶ GET /schedules/analyze
  │   └─ Uses ScheduleOptimizer.analyzeAllSchedules()
  │
  ├─▶ POST /optimizations/:id/feedback
  │   └─ Uses ScheduleOptimizer.recordFeedback()
  │
  └─▶ GET /optimizations/dashboard
      └─ Aggregates data from both optimizers
```

### 2. Server Integration

**File**: `server/src/index.js`

```javascript
// After database initialization in start():
const db = getDB();
const optimizationRoutes = setupOptimizationRoutes(db, null, EventEmitter);
app.use('/api/optimizations', apiLimiter, authenticate, optimizationRoutes);

// EventEmitter enables real-time updates
workflowOrchestrator.on('workflow:completed', (event) => {
  io.emit('workflow:completed', event);
  // Trigger optimization analysis asynchronously
  processOptimizer.analyzeWorkflow(event.workflowId);
});

scheduleOptimizer.on('schedule:optimization_applied', (event) => {
  io.emit('schedule:optimization_applied', event);
});
```

### 3. Database Integration

**File**: `server/src/db/database.js`

Tables created during `initDB()`:
```sql
-- Stores workflow definitions
CREATE TABLE visual_workflows (id, name, nodes, edges, status, version, ...)

-- Tracks approval workflow
CREATE TABLE workflow_approvals (id, workflow_id, submitted_by, status, ...)

-- Records execution details for analysis
CREATE TABLE workflow_executions (id, workflow_id, execution_trace, node_states, ...)

-- Tracks applied optimizations
CREATE TABLE workflow_optimizations (id, workflow_id, optimization_type, status, ...)

-- Stores cron-based schedules
CREATE TABLE schedules (id, name, cron_expression, status, ...)

-- Records schedule execution history
CREATE TABLE schedule_executions (id, schedule_id, status, duration, ...)

-- Tracks optimization effectiveness
CREATE TABLE optimization_feedback (id, optimization_id, approved, feedback, ...)
```

## Usage Workflows

### Workflow A: Create, Approve, and Optimize

```javascript
// 1. Create workflow (UI drag-drop → REST API)
POST /api/workflows
{
  name: "Daily Pipeline",
  nodes: [...],
  edges: [...]
}
Response: { id: "wf-123", status: "draft" }

// 2. Submit for approval
POST /api/workflows/wf-123/approvals
{ comment: "Updated for Q4" }
Response: { status: "pending_approval" }
// UI receives: workflow:pending_approval event

// 3. Admin approves
POST /api/workflows/wf-123/approvals/apr-456/approve
Response: { status: "active" }
// Workflow now executable

// 4. Execute workflow (triggered by schedule or manual)
POST /api/workflows/wf-123/execute
{ initiatedBy: "admin@example.com" }
Response: { executionId: "exec-789", status: "running" }
// UI receives real-time: workflow:node_executed events

// 5. After 100 executions, analyze
POST /api/optimizations/workflows/wf-123/analyze
Response: {
  suggestions: [
    { type: "parallelization", priority: "high", estimatedImprovement: "35%" }
  ]
}

// 6. Apply optimization
POST /api/optimizations/workflows/wf-123/optimizations/opt-001/apply
Response: { optimizationRequestId: "opt-req-001" }

// 7. User tests and gives feedback
POST /api/optimizations/opt-req-001/feedback
{ approved: true, feedback: "Saved 2 minutes per execution!" }

// System learns and increases recommendations for this pattern
```

### Workflow B: Analyze and Consolidate Schedules

```javascript
// 1. Get schedule analysis
GET /api/optimizations/schedules/analyze
Response: {
  suggestions: [
    {
      type: "consolidation",
      description: "Backup, Archive, Cleanup can be merged",
      timeSavings: 15
    }
  ]
}

// 2. View schedule timeline
GET /api/optimizations/schedules/visualization
Response: {
  hourly: {
    "2": ["Backup (15min)", "Archive (5min)", "Cleanup (8min)"]
  }
}

// 3. Apply consolidation
POST /api/optimizations/schedules/consolidation-1/apply
{
  optimization: {
    type: "consolidation",
    mergeSchedules: ["backup-id", "archive-id", "cleanup-id"],
    newStartTime: "2:00"
  }
}

// 4. Record result
POST /api/optimizations/opt-123/feedback
{ approved: true, feedback: "Works great!" }

// 5. System updates learning metrics
GET /api/optimizations/learning/report
Response: {
  approvalRate: "75%",
  effectiveness: "High",
  recommendations: ["Continue consolidation strategy"]
}
```

## Real-Time Communication

### WebSocket Events

The system uses Socket.IO to provide real-time updates to connected dashboard clients:

```javascript
// Workflow execution progress
socket.on('workflow:execution_plan', (data) => {
  // User sees what will execute before it starts
  displayPlan(data.plan);  // [start, task1, task2, end]
});

socket.on('workflow:node_executed', (data) => {
  // Real-time node status update
  updateNodeUI(data.nodeId, data.result);  // ✅ Completed in 245ms
});

socket.on('workflow:completed', (data) => {
  // Workflow finished - trigger analysis
  showResult(data.duration);  // "Completed in 12.5 minutes"
  requestAnalysis(data.workflowId);
});

// Optimization suggestions
socket.on('optimization:suggested', (data) => {
  // New suggestion available
  showOptimizationCard(data.suggestion);
});

// Schedule changes
socket.on('schedule:optimization_applied', (data) => {
  // Consolidate/stagger applied
  refreshScheduleTimeline();
});

// Learning updates
socket.on('learning:report_updated', (data) => {
  // Approval rate increased
  showLearningMetrics(data.metrics);
});
```

## Performance Considerations

### Analysis Performance
- Workflow analysis (100 executions): ~500ms
- Schedule analysis (24 schedules): ~200ms
- Dashboard aggregation: ~350ms

### Database Indexes
All tables have indexes on frequently queried columns:
```sql
CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_schedule_executions_schedule ON schedule_executions(schedule_id);
CREATE INDEX idx_workflow_approvals_status ON workflow_approvals(status);
```

### Scalability Limits
- Up to 1000+ schedules analyzed
- 10000+ workflow executions processed
- 100+ concurrent workflow executions with real-time tracing

## Deployment Notes

### Environment Variables
```bash
DB_PATH=./data/momobot.db          # Database location
PORT=4000                           # Server port
CLIENT_URL=http://localhost:3000    # Frontend URL
```

### Database Migration
On first startup, `initDB()` automatically creates:
- All workflow tables
- All optimization tables
- All schedule tables
- Required indexes

No manual migration needed.

### WebSocket Configuration
The system requires WebSocket support (enabled by default in Express/Socket.IO):
```javascript
const io = new SocketServer(server, {
  cors: { origin: 'http://localhost:3000' },
  pingInterval: 25000,
  pingTimeout: 60000
});
```

## Testing the System

### Test Workflow Analysis
```bash
# Create test workflow
curl -X POST http://localhost:4000/api/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow",
    "nodes": [...],
    "edges": [...]
  }'

# Analyze after 100+ executions
curl http://localhost:4000/api/optimizations/workflows/wf-123/analyze \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Test Schedule Analysis
```bash
# Get schedule analysis
curl http://localhost:4000/api/optimizations/schedules/analyze \
  -H "Authorization: Bearer $TOKEN" | jq .

# View timeline
curl http://localhost:4000/api/optimizations/schedules/visualization \
  -H "Authorization: Bearer $TOKEN" | jq .visualization
```

### Test Learning Feedback
```bash
# Record approval
curl -X POST http://localhost:4000/api/optimizations/opt-123/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved": true, "feedback": "Works great!"}'

# Check learning metrics
curl http://localhost:4000/api/optimizations/learning/report \
  -H "Authorization: Bearer $TOKEN" | jq .
```

## Future Enhancements

1. **ML-Based Optimization**: Machine learning for more intelligent suggestions
2. **Cost Analysis**: Optimize based on cloud resource costs
3. **Anomaly Detection**: Alert on workflow behavior deviations
4. **A/B Testing**: Automatically test optimization strategies
5. **Predictive Scaling**: Predict resource needs before execution
6. **Custom Metrics**: User-defined optimization goals

## Troubleshooting

### Database Error "Cannot create table"
- Check `data/` directory exists and is writable
- Verify no database locks: `rm server/data/momobot.db`
- Restart server: `npm run dev`

### Optimizations Not Suggesting
- Need minimum 20+ workflow executions for analysis
- Check `workflow_executions` table has data
- Verify scheduling is enabled: `status = 'active'`

### Learning Report Shows 0% Approval
- No feedback recorded yet
- Submit optimization and use `/feedback` endpoint
- Check `optimization_feedback` table populated

### WebSocket Events Not Received
- Verify client connected: `socket.connected`
- Check server logs: `docker-compose logs server`
- Ensure CORS enabled for frontend origin
