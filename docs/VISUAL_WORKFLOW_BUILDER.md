# MomoBot Visual Workflow Builder - Implementation Guide

## Table of Contents

1. [Visual Editor Architecture](#visual-editor-architecture)
2. [Node Types & Configuration](#node-types--configuration)
3. [Building Workflows](#building-workflows)
4. [Execution Visualization](#execution-visualization)
5. [API Integration](#api-integration)
6. [Frontend Components](#frontend-components)
7. [Advanced Features](#advanced-features)

---

## Visual Editor Architecture

### Technology Stack

```
Frontend:
├─ Canvas Library: EasyFlow / React Flow
├─ UI Framework: React 18 + TypeScript
├─ State Management: Redux Toolkit
├─ HTTP Client: Axios
├─ WebSocket: Socket.io for real-time updates
└─ Styling: Tailwind CSS

Backend:
├─ Runtime: Node.js 18+
├─ Framework: Express.js
├─ Database: PostgreSQL
├─ Task Queue: Bull (Redis)
├─ File Storage: S3/Local
└─ Pub/Sub: Redis Streams

Infrastructure:
├─ Container: Docker
├─ Orchestration: Kubernetes
├─ Storage: PostgreSQL + Redis
└─ Load Balancer: Nginx
```

### Component Hierarchy

```
┌──────────────────────────────────────────────────────┐
│         WorkflowBuilderPage                         │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  Header (Tools, Zoom, Export)                  │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  Canvas (Workflow visualization)               │ │
│  │  ├─ Nodes (draggable, configurable)           │ │
│  │  ├─ Connections (lines showing data flow)     │ │
│  │  ├─ Context Menu (on right-click)             │ │
│  │  └─ Minimap (navigation)                      │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  Right Sidebar (Node Properties)               │ │
│  │  ├─ General (name, type, description)         │ │
│  │  ├─ Configuration (action-specific settings)   │ │
│  │  ├─ Input/Output Variables                    │ │
│  │  └─ Error Handling                            │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  Bottom Panel (Logs, Validation Errors)       │ │
│  │  ├─ Validation Messages                       │ │
│  │  ├─ Warnings & Suggestions                    │ │
│  │  └─ Execution Logs (during running)           │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Node Types & Configuration

### 1. Trigger Nodes

Start workflow execution.

#### Schedule Trigger

```typescript
interface ScheduleTriggerConfig {
  type: "schedule";
  trigger: "cron" | "interval" | "webhook";
  
  // For cron
  cron: string;           // "0 9 * * *" (9 AM daily)
  timezone: string;       // "America/New_York"
  
  // For interval
  interval: number;       // milliseconds (3600000 = 1 hour)
  
  // For webhook
  webhookPath: string;    // "/webhooks/orders"
  
  description: string;
  enabled: boolean;
}

// UI Configuration
┌─────────────────────────────────────────┐
│ Schedule Trigger Configuration          │
├─────────────────────────────────────────┤
│                                         │
│ Trigger Type: [▼] Cron                 │
│                                         │
│ Cron Expression:                        │
│ [0 9 * * *________________]             │
│ (9 AM every day)                        │
│                                         │
│ Timezone: [America/New_York]           │
│                                         │
│ ☑ Enabled                              │
│                                         │
│ Description:                            │
│ [Daily morning data sync_____]         │
│                                         │
│ [Help] [Test] [Save]                   │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Action Nodes

Execute tasks or operations.

#### Database Query Action

```typescript
interface DatabaseQueryConfig {
  type: "action";
  action: "database_query";
  
  database: string;         // "main", "reporting", etc.
  queryType: "select" | "insert" | "update" | "delete";
  table: string;
  columns: string[];        // ["id", "email", "status"]
  
  // Filtering
  where: Record<string, any>;      // {email: "user@example.com"}
  limit: number;                   // 1000
  offset: number;                  // 0
  
  // Sorting  
  orderBy: [{field: string, direction: "asc" | "desc"}];
  
  // Execution options
  timeout: number;          // milliseconds
  retry: {
    maxAttempts: number;
    backoffMs: number;
    exponential: boolean;
  };
  
  // Caching
  cache: {
    enabled: boolean;
    ttl: number;           // seconds
    key: string;           // custom cache key
  };
}

// UI Configuration
┌──────────────────────────────────────────┐
│ Database Query Configuration             │
├──────────────────────────────────────────┤
│                                          │
│ Database: [▼] main                      │
│ Query Type: [▼] SELECT                  │
│ Table: [users________________]           │
│                                          │
│ Columns to fetch:                        │
│ ☑ id    ☑ email    ☑ status    ☑ name   │
│                                          │
│ Filters:                                 │
│ ├─ status = [▼] active                  │
│ ├─ updated > [2026-03-01____]           │
│ └─ [+ Add Filter]                       │
│                                          │
│ Limit: [1000_______] rows                │
│ Sort by: [email ▼] [Ascending ▼]        │
│                                          │
│ Execution Options:                       │
│ ├─ Timeout: [30______] seconds          │
│ ├─ Retry: [3_] attempts, [1000_] ms    │
│ └─ ☑ Exponential backoff                │
│                                          │
│ Caching:                                 │
│ ├─ ☑ Enable cache                       │
│ ├─ TTL: [3600_____] seconds (1 hour)   │
│ └─ Cache key: [auto-generated__]        │
│                                          │
│ [Test Query] [Save]                     │
│                                          │
└──────────────────────────────────────────┘
```

#### HTTP Request Action

```typescript
interface HttpRequestConfig {
  type: "action";
  action: "http_request";
  
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  
  headers: Record<string, string>;
  body: Record<string, any>;
  
  // Authentication
  auth: {
    type: "none" | "bearer" | "basic" | "oauth2";
    credentials: string;
  };
  
  // Response handling
  expectedStatus: number[];        // [200, 201]
  timeout: number;
  retry: {
    maxAttempts: number;
    backoffMs: number;
  };
  
  // Output
  parseResponse: "json" | "text" | "xml";
  outputVariable: string;
}

// Example: Call external API
┌──────────────────────────────────────────┐
│ HTTP Request Configuration               │
├──────────────────────────────────────────┤
│                                          │
│ Method: [▼] POST                         │
│ URL: [https://api.example.com/users___] │
│                                          │
│ Headers:                                 │
│ ├─ Authorization: Bearer {token}        │
│ ├─ Content-Type: application/json       │
│ └─ [+ Add Header]                       │
│                                          │
│ Body:                                    │
│ ┌──────────────────────────────┐        │
│ │ {                            │        │
│ │   "name": "{{firstName}}",   │        │
│ │   "email": "{{email}}",      │        │
│ │   "status": "active"         │        │
│ │ }                            │        │
│ └──────────────────────────────┘        │
│                                          │
│ Authentication: [▼] Bearer               │
│ Token: [••••••••••••••••••___]           │
│                                          │
│ Expected Status: [200_, 201_]           │
│ Timeout: [30_____] seconds              │
│ Retry: [3_] attempts                    │
│                                          │
│ Parse Response as: [▼] JSON             │
│ Output Variable: [api_response___]      │
│                                          │
│ [Test Request] [Save]                   │
│                                          │
└──────────────────────────────────────────┘
```

### 3. Logic Nodes

Control workflow flow based on conditions.

#### Conditional (If/Else)

```typescript
interface ConditionalNodeConfig {
  type: "logic";
  logic: "conditional";
  
  condition: {
    operator: "and" | "or";
    rules: [
      {
        field: string;           // variable name
        operator: "==" | "!=" | ">" | "<" | "contains" | "in";
        value: any;
      }
    ];
  };
  
  truePath: string;              // node ID for true case
  falsePath: string;             // node ID for false case
  defaultPath: string;           // if condition undefined
}

// UI Configuration
┌──────────────────────────────────────────┐
│ Conditional Logic Configuration          │
├──────────────────────────────────────────┤
│                                          │
│ Operator: [AND___] [OR___]              │
│                                          │
│ Rules:                                   │
│ ├─ [count   ▼] [>   ▼] [1000____]       │
│ └─ [status  ▼] [==  ▼] [active  ▼]      │
│                                          │
│ [+ Add Rule]                             │
│                                          │
│ Paths:                                   │
│ ├─ If TRUE:  Connect to [Action_xyz]   │
│ ├─ If FALSE: Connect to [Action_abc]   │
│ └─ Default:  Connect to [End]          │
│                                          │
│ [Save]                                   │
│                                          │
└──────────────────────────────────────────┘
```

### 4. Data Nodes

Transform and manipulate data.

#### JSON Transform

```typescript
interface JsonTransformConfig {
  type: "data";
  transform: "json_transform";
  
  input: Record<string, any>;     // source data
  
  mappings: [
    {
      source: string;             // "user.email"
      target: string;             // "contact_email"
      type: string;               // "string" | "number" | "boolean"
      transform?: string;         // javascript expression
    }
  ];
  
  outputVariable: string;
}

// Example: Flatten nested object
┌──────────────────────────────────────────┐
│ JSON Transform Configuration             │
├──────────────────────────────────────────┤
│                                          │
│ Input Data:                              │
│ ┌──────────────────────────────┐        │
│ │ {                            │        │
│ │   "user": {                  │        │
│ │     "id": 123,               │        │
│ │     "email": "user@test.com" │        │
│ │   }                          │        │
│ │ }                            │        │
│ └──────────────────────────────┘        │
│                                          │
│ Mappings:                                │
│ ├─ user.id        → user_id     (num)   │
│ ├─ user.email     → email       (str)   │
│ └─ [+ Add Mapping]                      │
│                                          │
│ Output Variable: [user_flat____]        │
│                                          │
│ [Save]                                   │
│                                          │
└──────────────────────────────────────────┘
```

---

## Building Workflows

### Step-by-Step Example: Customer Email Campaign

#### Step 1: Add Trigger Node

```
Click on canvas → Select "Schedule Trigger" from left panel
├─ Set: Cron = "0 9 * * 1" (9 AM Mondays)
└─ Name: "Monday Morning"
```

#### Step 2: Add Data Query Node

```
Drag "Database Query" node onto canvas
├─ Database: "analytics"
├─ Query: SELECT email, name, last_purchase FROM customers
├─ Where: last_purchase > "90 days ago"
├─ Limit: 5000
└─ Name: "Get inactive customers"
```

#### Step 3: Add Conditional Logic

```
Drag "Conditional" node onto canvas  
├─ Rule: count > 100
├─ True path: Send email
├─ False path: Skip (end)
└─ Name: "Should notify?"
```

#### Step 4: Add Send Email Action

```
Drag "Send Email" node onto canvas
├─ Template: "win-back-campaign"
├─ From: noreply@company.com
├─ To: {email} (from database)
├─ Subject: "We miss you! {{name}}"
├─ Body: <html>...winback content...</html>
└─ Name: "Send campaign email"
```

#### Step 5: Add Logging Node

```
Drag "Log Event" node onto canvas
├─ Message: "Campaign sent to {{count}} customers"
├─ Level: info
└─ Name: "Log completion"
```

#### Step 6: Connect Nodes

```
1. Monday Morning → Get inactive customers
2. Get inactive customers → Should notify?
3. Should notify? (true) → Send campaign email
4. Should notify? (false) → Log completion
5. Send campaign email → Log completion
```

#### Step 7: Add Error Handler

```
On each node (right-click) → Add error handler
├─ Node: Get inactive customers
├─ On Error: Send alert email (email_on_error_xyz)
└─ Restart workflow: YES
```

#### Final Workflow Visualization

```
        ┌──────────────────┐
        │ Monday Morning   │
        │ (Schedule)       │
        └─────────┬────────┘
                  ▼
        ┌──────────────────┐
        │ Get inactive     │
        │ customers (DB)   │
        └─────────┬────────┘
                  ▼
        ┌──────────────────┐
        │ Should notify?   │
        │ (count > 100)    │
        └────┬─────────┬───┘
        (Y)  │         │  (N)
            ▼         ▼
        [Email]    [Skip]
            │         │
            └────┬────┘
                 ▼
        ┌──────────────────┐
        │ Log completion   │
        │                  │
        └──────────────────┘
```

---

## Execution Visualization

### Real-Time Execution Dashboard

```
┌──────────────────────────────────────────────────┐
│ Execution Dashboard - Wednesday 12:34 PM         │
├──────────────────────────────────────────────────┤
│                                                  │
│ Workflow: Newsletter Campaign      Status: LIVE │
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │  Timeline & Progress                         ││
│ │                                              ││
│ │ Started: 12:30:45 PM    Elapsed: 3m 45s    ││
│ │ [████████████████░░] 87%   ETA: 2m 30s     ││
│ │                                              ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │  Step-by-Step Progress                       ││
│ │                                              ││
│ │ ✓  (Complete) Trigger: 12:30:45 PM          ││
│ │    └─ 0ms                                    ││
│ │                                              ││
│ │ ✓  (Complete) Fetch customers: 12:30:47 PM  ││
│ │    └─ 2.3s, Returned 4,234 rows             ││
│ │                                              ││
│ │ ✓  (Complete) Check count: 12:30:47 PM      ││
│ │    └─ 5ms, Condition TRUE                   ││
│ │                                              ││
│ │ ● (In Progress) Send emails: 12:30:48 PM    ││
│ │    └─ Sending to 4,234 recipients           ││
│ │    └─ Processed: 3,156 / 4,234 (74%)        ││
│ │    └─ Speed: 28 emails/sec                  ││
│ │    └─ Failures: 12 (retrying)               ││
│ │                                              ││
│ │ ◇ (Pending) Log completed: Waiting...       ││
│ │     └─ Will run after email step            ││
│ │                                              ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │  Execution Logs                              ││
│ │                                              ││
│ │ [12:30:45] ℹ  Workflow execution started    ││
│ │ [12:30:45] ℹ  Trigger fired (Monday 9 AM)  ││
│ │ [12:30:47] ℹ  Database query started        ││
│ │ [12:30:49] ✓  Query returned 4,234 rows    ││
│ │ [12:30:50] ℹ  Condition evaluated: TRUE     ││
│ │ [12:30:50] ℹ  Email sending started         ││
│ │ [12:31:23] ⚠  Retry #1 for user_445        ││
│ │ [12:31:45] ⚠  Retry #1 for user_879        ││
│ │ [12:34:15] ℹ  Email batch 1 sent (1000)    ││
│ │ [12:34:45] ℹ  Email batch 2 sent (2156)    ││
│ │                                              ││
│ │ [Expand] [Download Logs] [Clear]            ││
│ │                                              ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │  Device Status                               ││
│ │                                              ││
│ │ device-001 (database):  [████░] 80% load    ││
│ │ device-002 (email):     [███░░] 60% load    ││
│ │ device-003 (email):     [██░░░] 40% load    ││
│ │                                              ││
│ │ Network: 45 Mbps outbound                    ││
│ │ Memory: 620MB / 2GB                          ││
│ │                                              ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ [Pause] [Stop Execution] [View Workflow]       │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## API Integration

### REST API Endpoints

```bash
# Create workflow
POST /api/workflows
Content-Type: application/json
{
  "name": "Daily Report",
  "description": "Generate daily reports",
  "nodes": [...],
  "connections": [...]
}
Response: { workflow_id, status, ai_analysis }

# Execute workflow
POST /api/workflows/{workflow_id}/execute
{
  "executed_by": "user@company.com",
  "variables": {"date": "2026-03-13"},
  "scheduled_for": "2026-03-13T09:00:00Z"
}
Response: { execution_id, status, estimated_duration }

# Get execution status  
GET /api/workflows/{workflow_id}/executions/{execution_id}
Response: {
  execution_id,
  status (in_progress|completed|failed),
  steps: [{id, status, duration, logs}],
  progress: 75
}

# WebSocket: Real-time updates
WS /ws/execution/{execution_id}
Events:
├─ step_started: {step_id, timestamp}
├─ step_progress: {step_id, progress, logs}
├─ step_completed: {step_id, duration, output}
├─ execution_completed: {status, total_duration}
└─ error: {step_id, error_message}
```

---

## Frontend Components

### Canvas Component (React)

```typescript
import { ReactFlow, Background, Controls } from 'react-flow-renderer';

export function WorkflowCanvas() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(applyNodeChanges(changes, nodes)),
    [nodes]
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges(applyEdgeChanges(changes, edges)),
    [edges]
  );
  
  return (
    <ReactFlow nodes={nodes} edges={edges} 
               onNodesChange={onNodesChange}
               onEdgesChange={onEdgesChange}>
      <Background />
      <Controls />
    </ReactFlow>
  );
}
```

### Node Configuration Panel

```typescript
export function NodeConfigPanel({ nodeId, nodeConfig }) {
  return (
    <div className="node-config-panel">
      <h3>{nodeConfig.name}</h3>
      
      {/* General Settings */}
      <div className="section">
        <label>Name: <input defaultValue={nodeConfig.name} /></label>
        <label>Description: <textarea>{nodeConfig.description}</textarea></label>
      </div>
      
      {/* Action-specific config */}
      {renderActionConfig(nodeConfig.type, nodeConfig.config)}
      
      {/* Input/Output */}
      <div className="section">
        <h4>Input Variables</h4>
        {nodeConfig.inputs?.map(input => (
          <div key={input.id}>{input.name} ({input.type})</div>
        ))}
      </div>
      
      <div className="section">
        <h4>Output Variables</h4>  
        {nodeConfig.outputs?.map(output => (
          <div key={output.id}>{output.name} ({output.type})</div>
        ))}
      </div>
      
      {/* Error Handling */}
      <div className="section">
        <h4>Error Handling</h4>
        <select>
          <option>Stop workflow</option>
          <option>Retry</option>
          <option>Use fallback</option>
        </select>
      </div>
    </div>
  );
}
```

---

## Advanced Features

### Variable Interpolation

```
Variable syntax: {{variable_name}}

Example workflow:
├─ Step 1: Fetch user email: user@example.com
├─ Step 2: Send email using: {{user_email}}
│          Resolves to: user@example.com
│
├─ Nested: {{user.contact.email}}
│          Resolves to: nested.user.contact.email
│
└─ Expression: {{count * 2}}
              Evaluates mathematical expressions
```

### Error Recovery

```
Error Handling Strategies:

1. Retry with backoff
   ├─ Max attempts: 3
   ├─ Initial delay: 1s
   ├─ Backoff: exponential (×2 each retry)
   └─ Delays: 1s, 2s, 4s

2. Fallback path
   ├─ Primary: API call
   ├─ On error: Use cached data
   └─ Last resort: Use default value

3. Manual intervention
   ├─ Pause workflow
   ├─ Alert human
   ├─ Wait for manual action
   └─ Resume or cancel

4. Compensating transaction
   ├─ If payment fails
   ├─ Rollback inventory
   ├─ Notify user
   └─ Cleanup resources
```

### Performance Metrics

```
Monitor these during execution:

├─ Execution Time
│  ├─ Total duration
│  ├─ Per-step duration
│  ├─ Bottleneck identification
│  └─ Comparison with average
│
├─ Resource Usage
│  ├─ Memory per step
│  ├─ CPU utilization
│  ├─ Network bandwidth
│  └─ Disk I/O
│
├─ Reliability
│  ├─ Success rate
│  ├─ Retry frequency
│  ├─ Error types
│  └─ Recovery success rate
│
└─ Cost
   ├─ Per execution
   ├─ Resource cost
   └─ API call costs
```

---

## Summary

The Visual Workflow Builder provides:

1. **Intuitive UI**: Drag-drop node-based workflow design
2. **Rich Actions**: Database, HTTP, Email, File operations
3. **Smart Logic**: Conditional branching, loops, parallel execution
4. **Real-time Monitoring**: Live progress tracking during execution
5. **Error Handling**: Multiple recovery strategies
6. **Optimization**: Automatic performance improvement suggestions
7. **Multi-user**: Collaborative workflow design with approvals

This enterprise-grade workflow engine makes RPA accessible to business users while maintaining technical sophistication for advanced use cases.
