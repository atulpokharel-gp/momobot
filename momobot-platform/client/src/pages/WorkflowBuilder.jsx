import React, { useState, useRef, useEffect } from 'react';
import '../styles/WorkflowBuilder.css';
import api from '../services/api';
import toast from 'react-hot-toast';

const WorkflowBuilder = () => {
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowName, setWorkflowName] = useState('');
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [nodeIdCounter, setNodeIdCounter] = useState(0);
  const [connectMode, setConnectMode] = useState(null);
  const [executionLog, setExecutionLog] = useState([]);

  const AVAILABLE_NODES = [
    { type: 'trigger', label: 'Start Trigger', icon: '▶️', color: '#10b981' },
    { type: 'browser_open', label: 'Open Browser', icon: '🌐', color: '#3b82f6' },
    { type: 'browser_youtube', label: 'Play YouTube', icon: '▶️', color: '#ef4444' },
    { type: 'browser_navigate', label: 'Navigate URL', icon: '🔗', color: '#3b82f6' },
    { type: 'shell', label: 'Execute Shell', icon: '⌨️', color: '#8b5cf6' },
    { type: 'screenshot', label: 'Take Screenshot', icon: '📸', color: '#f59e0b' },
    { type: 'file_ops', label: 'File Operations', icon: '📁', color: '#6b7280' },
    { type: 'email', label: 'Send Email', icon: '📧', color: '#ec4899' },
    { type: 'delay', label: 'Wait/Delay', icon: '⏱️', color: '#06b6d4' },
    { type: 'condition', label: 'If/Condition', icon: '❓', color: '#f97316' },
    { type: 'end', label: 'End', icon: '✓', color: '#6b7280' }
  ];

  // Draw connections on SVG
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear SVG
    svgRef.current.innerHTML = '';
    
    const svg = svgRef.current;
    const container = document.querySelector('.nodes-container');
    if (!container) return;

    // Draw all edges as lines
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      
      if (!fromNode || !toNode) return;

      const x1 = fromNode.x + 70;
      const y1 = fromNode.y + 80;
      const x2 = toNode.x + 70;
      const y2 = toNode.y + 20;

      // Draw curved line (bezier curve)
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const midX = (x1 + x2) / 2;
      const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
      
      line.setAttribute('d', d);
      line.setAttribute('stroke', '#667eea');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('fill', 'none');
      line.setAttribute('marker-end', 'url(#arrowhead)');
      
      svg.appendChild(line);
    });

    // Arrow marker definition
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3, 0 6');
    polygon.setAttribute('fill', '#667eea');
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.insertBefore(defs, svg.firstChild);
  }, [edges, nodes]);

  // Connect nodes handler
  const startConnection = (nodeId) => {
    if (connectMode?.from === nodeId) {
      setConnectMode(null);
      return;
    }
    setConnectMode({ from: nodeId });
    toast('Click another node to connect', { icon: '🔗' });
  };

  const finishConnection = (toNodeId) => {
    if (!connectMode || !connectMode.from) return;
    if (connectMode.from === toNodeId) {
      toast.error('Cannot connect node to itself');
      setConnectMode(null);
      return;
    }
    
    // Check if connection already exists
    const exists = edges.some(e => e.from === connectMode.from && e.to === toNodeId);
    if (exists) {
      toast.error('Connection already exists');
      setConnectMode(null);
      return;
    }
    
    connectNodes(connectMode.from, toNodeId);
    toast.success('Connected!');
    setConnectMode(null);
  };

  // Execute workflow
  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      toast.error('Add nodes to the workflow first');
      return;
    }

    setExecuting(true);
    setExecutionLog([]);
    
    try {
      const payload = {
        workflowName: workflowName || 'untitled-workflow',
        definition: { nodes, edges },
        startTime: new Date().toISOString()
      };

      const response = await api.post('/workflows/execute', payload);
      setExecutionLog(response.data.executionLog || ['Workflow executed successfully']);
      toast.success('Workflow executed!');
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setExecutionLog([`Error: ${errorMsg}`]);
      toast.error('Execution failed: ' + errorMsg);
    } finally {
      setExecuting(false);
    }
  };
  const addNode = (nodeType) => {
    const newNode = {
      id: `node-${nodeIdCounter}`,
      type: nodeType,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      label: AVAILABLE_NODES.find(n => n.type === nodeType)?.label || nodeType,
      params: {}
    };
    setNodes([...nodes, newNode]);
    setNodeIdCounter(nodeIdCounter + 1);
  };

  // Delete node
  const deleteNode = (nodeId) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.from !== nodeId && e.to !== nodeId));
    setSelectedNode(null);
  };

  // Update node position (for dragging)
  const updateNodePosition = (nodeId, x, y) => {
    setNodes(nodes.map(n => (n.id === nodeId ? { ...n, x, y } : n)));
  };

  // Connect nodes
  const connectNodes = (fromNodeId, toNodeId) => {
    const newEdge = {
      id: `edge-${nodes.length}`,
      from: fromNodeId,
      to: toNodeId
    };
    setEdges([...edges, newEdge]);
  };

  // Save workflow
  const saveWorkflow = async () => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: workflowName,
        description: `Visual workflow with ${nodes.length} nodes`,
        definition: {
          nodes: nodes,
          edges: edges,
          metadata: {
            createdAt: new Date().toISOString(),
            type: 'visual'
          }
        }
      };

      const response = await api.post('/workflows/email-check', payload);
      alert('Workflow saved successfully!');
      setWorkflowName('');
    } catch (error) {
      alert('Error saving workflow: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="workflow-builder">
      <div className="workflow-header">
        <h1>🔗 Visual Workflow Builder</h1>
        <p>Drag nodes to create automated workflows (n8n style)</p>
      </div>

      <div className="workflow-container">
        {/* Left Sidebar - Node Palette */}
        <div className="node-palette">
          <h3>Nodes</h3>
          <div className="node-grid">
            {AVAILABLE_NODES.map(node => (
              <button
                key={node.type}
                className="node-btn"
                onClick={() => addNode(node.type)}
                style={{ borderLeftColor: node.color }}
                title={`Add ${node.label}`}
              >
                <span className="node-icon">{node.icon}</span>
                <span className="node-name">{node.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="canvas-wrapper">
          <div className="canvas-controls">
            <input
              type="text"
              placeholder="Workflow name..."
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="workflow-name-input"
            />
            <button onClick={saveWorkflow} disabled={saving} className="save-btn">
              {saving ? 'Saving...' : '💾 Save Workflow'}
            </button>
            <button onClick={executeWorkflow} disabled={executing} className="execute-btn">
              {executing ? 'Executing...' : '▶️ Execute'}
            </button>
          </div>

          {/* SVG Canvas for Drawing Lines */}
          <svg ref={svgRef} className="workflow-svg" style={{
            position: 'absolute',
            top: '60px',
            left: '0',
            width: '100%',
            height: 'calc(100% - 60px)',
            pointerEvents: 'none',
            zIndex: 1
          }}></svg>

          {/* Nodes on Canvas */}
          <div className="nodes-container">
            {nodes.map(node => (
              <div
                key={node.id}
                className={`workflow-node ${selectedNode?.id === node.id ? 'selected' : ''} ${connectMode?.from === node.id ? 'connecting' : ''}`}
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
                onClick={() => {
                  if (connectMode) {
                    finishConnection(node.id);
                  } else {
                    setSelectedNode(node);
                  }
                }}
                draggable
                onDragEnd={(e) => {
                  const rect = document.querySelector('.nodes-container').getBoundingClientRect();
                  updateNodePosition(node.id, e.clientX - rect.left - 50, e.clientY - rect.top - 30);
                }}
              >
                <div className="node-header" style={{
                  backgroundColor: AVAILABLE_NODES.find(n => n.type === node.type)?.color
                }}>
                  <span>{AVAILABLE_NODES.find(n => n.type === node.type)?.icon}</span>
                </div>
                <div className="node-body">
                  <p>{node.label}</p>
                </div>
                <div className="node-ports">
                  <div className="port in" title="Connect from here"></div>
                  <div className="port out" title="Connect to here"></div>
                </div>
                <button
                  className="node-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(node.id);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Execution Log */}
          {executionLog.length > 0 && (
            <div className="execution-log">
              <h4>📋 Execution Log</h4>
              <div className="log-content">
                {executionLog.map((log, idx) => (
                  <p key={idx} className={log.includes('Error') ? 'error' : ''}>{log}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Node Properties */}
        <div className="node-properties">
          <h3>Properties</h3>
          {selectedNode ? (
            <div className="properties-form">
              <div className="prop-group">
                <label>Node Type</label>
                <input type="text" value={selectedNode.type} disabled />
              </div>
              <div className="prop-group">
                <label>Node ID</label>
                <input type="text" value={selectedNode.id} disabled />
              </div>
              <div className="prop-group">
                <label>Position</label>
                <p>X: {Math.round(selectedNode.x)}, Y: {Math.round(selectedNode.y)}</p>
              </div>
              {selectedNode.type === 'browser_open' && (
                <div className="prop-group">
                  <label>URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    onChange={(e) => {
                      setSelectedNode({
                        ...selectedNode,
                        params: { ...selectedNode.params, url: e.target.value }
                      });
                    }}
                  />
                </div>
              )}
              {selectedNode.type === 'browser_youtube' && (
                <div className="prop-group">
                  <label>Video ID</label>
                  <input
                    type="text"
                    placeholder="dQw4w9WgXcQ"
                    onChange={(e) => {
                      setSelectedNode({
                        ...selectedNode,
                        params: { ...selectedNode.params, videoId: e.target.value }
                      });
                    }}
                  />
                </div>
              )}
              {selectedNode.type === 'shell' && (
                <div className="prop-group">
                  <label>Command</label>
                  <textarea
                    placeholder="echo 'Hello World'"
                    onChange={(e) => {
                      setSelectedNode({
                        ...selectedNode,
                        params: { ...selectedNode.params, command: e.target.value }
                      });
                    }}
                  />
                </div>
              )}
              <div className="prop-actions">
                <button 
                  className={`connect-btn ${connectMode?.from === selectedNode.id ? 'active' : ''}`}
                  onClick={() => startConnection(selectedNode.id)}
                >
                  {connectMode?.from === selectedNode.id ? '🔗 Cancel' : '🔗 Connect'}
                </button>
                <button className="delete-btn" onClick={() => deleteNode(selectedNode.id)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          ) : (
            <p className="no-selection">Select a node to view properties</p>
          )}

          <div className="workflow-stats">
            <h4>Workflow Stats</h4>
            <p>Nodes: <strong>{nodes.length}</strong></p>
            <p>Connections: <strong>{edges.length}</strong></p>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="workflow-help">
        <h3>How to Use</h3>
        <ul>
          <li>✅ Drag node buttons from left panel to add them</li>
          <li>🖱️ Drag nodes on canvas to reposition</li>
          <li>⚙️ Click node to select and configure properties</li>
          <li>🔗 Click "Connect" button, then click target node to create connection</li>
          <li>📍 Visual lines show workflow connections between nodes</li>
          <li>▶️ Click Execute button to run the workflow</li>
          <li>💾 Enter workflow name and save</li>
        </ul>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
