import React, { useState, useRef, useEffect } from 'react';
import '../styles/WorkflowBuilder.css';
import api from '../services/api';
import toast from 'react-hot-toast';

const WorkflowBuilder = () => {
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [nodeIdCounter, setNodeIdCounter] = useState(0);
  const [connectMode, setConnectMode] = useState(null);
  const [executionLog, setExecutionLog] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [workflowWarnings, setWorkflowWarnings] = useState([]);
  const [saveAsTaskType, setSaveAsTaskType] = useState(false);
  const [taskTypeConfig, setTaskTypeConfig] = useState({
    name: '',
    description: '',
    icon: '⚡'
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Resizable panels
  const [leftPanelWidth, setLeftPanelWidth] = useState(260);
  const [rightPanelWidth, setRightPanelWidth] = useState(300);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [resizing, setResizing] = useState(null);

  const AVAILABLE_NODES = [
    // Trigger & Control
    { type: 'webhook', label: 'Webhook', icon: '🪝', color: '#ef4444', category: 'Trigger' },
    { type: 'trigger', label: 'Start', icon: '▶️', color: '#10b981', category: 'Trigger' },
    { type: 'schedule', label: 'Schedule', icon: '⏰', color: '#f59e0b', category: 'Trigger' },
    
    // AI & Models
    { type: 'ai_agent', label: 'AI Agent', icon: '🤖', color: '#8b5cf6', category: 'AI' },
    { type: 'llm', label: 'LLM Model', icon: '🧠', color: '#06b6d4', category: 'AI' },
    { type: 'embed', label: 'Embeddings', icon: '📊', color: '#ec4899', category: 'AI' },
    
    // Data & API
    { type: 'http_request', label: 'HTTP Request', icon: '🌐', color: '#3b82f6', category: 'API' },
    { type: 'api_call', label: 'API Call', icon: '⚙️', color: '#06b6d4', category: 'API' },
    { type: 'database', label: 'Database', icon: '🗄️', color: '#6b7280', category: 'Data' },
    { type: 'json_parser', label: 'JSON Parser', icon: '{}', color: '#f97316', category: 'Data' },
    
    // Flow Control
    { type: 'condition', label: 'If/Condition', icon: '❓', color: '#f97316', category: 'Logic' },
    { type: 'switch', label: 'Switch', icon: '🔀', color: '#8b5cf6', category: 'Logic' },
    { type: 'loop', label: 'Loop', icon: '🔄', color: '#10b981', category: 'Logic' },
    
    // Actions
    { type: 'browser_open', label: 'Open Browser', icon: '🌐', color: '#3b82f6', category: 'Action' },
    { type: 'screenshot', label: 'Screenshot', icon: '📸', color: '#f59e0b', category: 'Action' },
    { type: 'file_ops', label: 'File Ops', icon: '📁', color: '#6b7280', category: 'Action' },
    { type: 'email', label: 'Send Email', icon: '📧', color: '#ec4899', category: 'Action' },
    { type: 'shell', label: 'Shell Command', icon: '⌨️', color: '#8b5cf6', category: 'Action' },
    
    // Output
    { type: 'output_parser', label: 'Output Parser', icon: '📤', color: '#f97316', category: 'Output' },
    { type: 'return', label: 'Return', icon: '✓', color: '#10b981', category: 'Output' },
    { type: 'end', label: 'End', icon: '🛑', color: '#6b7280', category: 'Output' }
  ];

  // Load available agents
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const response = await api.get('/agents');
        setAgents(response.data.agents || []);
        if (response.data.agents?.length > 0) {
          setSelectedAgent(response.data.agents[0].id);
        }
      } catch (error) {
        console.error('Failed to load agents:', error);
        toast.error('Failed to load agents');
      }
    };
    loadAgents();
    
    // Load panel widths from localStorage
    const savedLeftWidth = localStorage.getItem('workflowLeftPanelWidth');
    const savedRightWidth = localStorage.getItem('workflowRightPanelWidth');
    const savedLeftCollapsed = localStorage.getItem('workflowLeftPanelCollapsed');
    const savedRightCollapsed = localStorage.getItem('workflowRightPanelCollapsed');
    
    if (savedLeftWidth) setLeftPanelWidth(parseInt(savedLeftWidth));
    if (savedRightWidth) setRightPanelWidth(parseInt(savedRightWidth));
    if (savedLeftCollapsed) setLeftPanelCollapsed(JSON.parse(savedLeftCollapsed));
    if (savedRightCollapsed) setRightPanelCollapsed(JSON.parse(savedRightCollapsed));
  }, []);
  
  // Handle panel resizing
  useEffect(() => {
    if (!resizing) return;
    
    const handleMouseMove = (e) => {
      if (resizing === 'left') {
        const newWidth = Math.max(150, Math.min(400, e.clientX - 230));
        setLeftPanelWidth(newWidth);
        localStorage.setItem('workflowLeftPanelWidth', newWidth.toString());
      } else if (resizing === 'right') {
        const newWidth = Math.max(150, Math.min(400, window.innerWidth - e.clientX));
        setRightPanelWidth(newWidth);
        localStorage.setItem('workflowRightPanelWidth', newWidth.toString());
      }
    };
    
    const handleMouseUp = () => {
      setResizing(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  // Handle pan and zoom (draw.io style)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mouse wheel zoom
    const handleWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      
      const zoomSpeed = 0.1;
      const newZoom = e.deltaY > 0 
        ? Math.max(0.1, zoom - zoomSpeed)
        : Math.min(3, zoom + zoomSpeed);
      
      setZoom(newZoom);
    };

    // Mouse drag for panning
    const handleMouseDown = (e) => {
      if (e.button === 2 || (e.button === 0 && e.ctrlKey)) { // Right click or Ctrl+Left click
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    };

    const handleMouseMove = (e) => {
      if (isPanning && containerRef.current) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown, { passive: false });
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('contextmenu', (e) => {
      if (e.ctrlKey) e.preventDefault();
    });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [zoom, pan, isPanning, panStart]);

  // Validate workflow for warnings
  const validateWorkflow = () => {
    const warnings = [];
    
    if (nodes.length === 0) {
      warnings.push('⚠️ Workflow has no nodes');
    }
    
    if (!edges.length && nodes.length > 1) {
      warnings.push('⚠️ Nodes are not connected');
    }
    
    const shellNodes = nodes.filter(n => n.type === 'shell');
    if (shellNodes.length > 0 && !selectedAgent) {
      warnings.push('⚠️ Shell commands require an agent assignment');
    }
    
    const triggerNodes = nodes.filter(n => ['webhook', 'trigger', 'schedule'].includes(n.type));
    if (triggerNodes.length === 0) {
      warnings.push('⚠️ Workflow has no trigger node (Start, Schedule, or Webhook)');
    }
    
    const endNodes = nodes.filter(n => ['end', 'return'].includes(n.type));
    if (endNodes.length === 0) {
      warnings.push('⚠️ Workflow has no end node');
    }
    
    // Check for orphaned nodes
    nodes.forEach(node => {
      const hasConnection = edges.some(e => e.from === node.id || e.to === node.id);
      if (!hasConnection && nodes.length > 1) {
        warnings.push(`⚠️ Node "${node.label}" is not connected to workflow`);
      }
    });
    
    setWorkflowWarnings(warnings);
    return warnings;
  };

  // Update warnings when nodes/edges/agent changes
  useEffect(() => {
    validateWorkflow();
  }, [nodes, edges, selectedAgent]);

  // Draw connections on SVG with improved styling
  useEffect(() => {
    if (!svgRef.current) return;
    
    svgRef.current.innerHTML = '';
    const svg = svgRef.current;
    const container = document.querySelector('.nodes-container');
    if (!container) return;

    // Create defs for decorative elements
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Arrow marker for standard edges
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
    svg.appendChild(defs);

    // Draw all edges as curved lines
    edges.forEach((edge, idx) => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      
      if (!fromNode || !toNode) return;

      // Node center positions
      const x1 = fromNode.x + 50;
      const y1 = fromNode.y + 50;
      const x2 = toNode.x + 50;
      const y2 = toNode.y + 50;

      // Smooth curve with bezier
      const dx = x2 - x1;
      const dy = y2 - y1;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const controlOffset = Math.max(100, distance * 0.3);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
      
      path.setAttribute('d', d);
      path.setAttribute('stroke', '#667eea');
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('fill', 'none');
      path.setAttribute('marker-end', 'url(#arrowhead)');
      path.setAttribute('class', 'workflow-edge');
      
      svg.appendChild(path);
    });

    // Draw connection preview if in connect mode
    if (connectMode?.from && !connectMode.to) {
      const fromNode = nodes.find(n => n.id === connectMode.from);
      if (fromNode) {
        const previewLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        previewLine.setAttribute('x1', fromNode.x + 50);
        previewLine.setAttribute('y1', fromNode.y + 50);
        previewLine.setAttribute('x2', connectMode.mouseX || fromNode.x + 50);
        previewLine.setAttribute('y2', connectMode.mouseY || fromNode.y + 50);
        previewLine.setAttribute('stroke', '#10b981');
        previewLine.setAttribute('stroke-width', '2');
        previewLine.setAttribute('stroke-dasharray', '5,5');
        previewLine.setAttribute('class', 'preview-edge');
        svg.appendChild(previewLine);
      }
    }
  }, [edges, nodes, connectMode]);

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
    const warnings = validateWorkflow();
    
    if (nodes.length === 0) {
      toast.error('Add nodes to the workflow first');
      return;
    }

    if (warnings.length > 0) {
      const shellNodes = nodes.filter(n => n.type === 'shell');
      if (shellNodes.length > 0 && !selectedAgent) {
        toast.error('Shell commands require an agent to be assigned');
        return;
      }
    }

    setExecuting(true);
    setExecutionLog([]);
    
    try {
      const payload = {
        workflowName: workflowName || 'untitled-workflow',
        agentId: selectedAgent || null,
        definition: { nodes, edges },
        startTime: new Date().toISOString(),
        warnings: workflowWarnings
      };

      const response = await api.post('/workflows/execute', payload);
      
      // Parse execution log from response
      let logs = response.data.executionLog || ['✅ Workflow executed successfully'];
      if (response.data.results) {
        logs = [
          '✅ Execution Complete',
          ...Object.entries(response.data.results).map(([key, value]) => 
            `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`
          )
        ];
      }
      
      setExecutionLog(logs);
      toast.success('✅ Workflow executed!');
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      const fullLog = [
        `❌ Execution Failed`,
        `Error: ${errorMsg}`,
        error.response?.data?.details ? `Details: ${error.response.data.details}` : ''
      ].filter(Boolean);
      setExecutionLog(fullLog);
      toast.error('❌ Execution failed');
    } finally {
      setExecuting(false);
    }
  };

  // Add node to canvas
  const addNode = (nodeType) => {
    const nodeConfig = AVAILABLE_NODES.find(n => n.type === nodeType);
    const newNode = {
      id: `node-${nodeIdCounter}`,
      type: nodeType,
      label: nodeConfig?.label || nodeType,
      x: Math.random() * 600 + 200,
      y: Math.random() * 400 + 150,
      color: nodeConfig?.color || '#667eea',
      icon: nodeConfig?.icon || '⚙️',
      params: {},
      inputs: [],
      outputs: []
    };
    setNodes([...nodes, newNode]);
    setNodeIdCounter(nodeIdCounter + 1);
    toast.success(`Added ${nodeConfig?.label || 'Node'}`);
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
      toast.error('Please enter a workflow name');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: workflowName,
        description: `Visual workflow with ${nodes.length} nodes and ${selectedAgent ? `assigned to agent` : 'no agent'}`,
        agentId: selectedAgent || null,
        definition: {
          nodes: nodes,
          edges: edges,
          metadata: {
            createdAt: new Date().toISOString(),
            type: 'visual',
            nodeCount: nodes.length,
            warnings: workflowWarnings
          }
        }
      };

      await api.post('/workflows', payload);
      toast.success('✅ Workflow saved successfully!');
      setWorkflowName('Untitled Workflow');
    } catch (error) {
      toast.error('Failed to save workflow: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Save workflow as custom task type
  const saveWorkflowAsTaskType = async () => {
    if (!taskTypeConfig.name.trim()) {
      toast.error('Please enter a task type name');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: `custom_${taskTypeConfig.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: taskTypeConfig.icon + ' ' + taskTypeConfig.name,
        description: taskTypeConfig.description || `Custom workflow: ${workflowName}`,
        icon: taskTypeConfig.icon,
        isCustom: true,
        workflowDefinition: {
          name: workflowName,
          nodes: nodes,
          edges: edges,
          agentId: selectedAgent || null,
          metadata: {
            createdAt: new Date().toISOString(),
            type: 'custom_task_workflow'
          }
        }
      };

      await api.post('/task-types', payload);
      toast.success(`✅ "${taskTypeConfig.name}" added to Task Creator!`);
      setSaveAsTaskType(false);
      setTaskTypeConfig({ name: '', description: '', icon: '⚡' });
    } catch (error) {
      toast.error('Failed to save as task type: ' + error.message);
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

      <div className="workflow-container" style={{
        display: 'flex',
        gap: 0,
        overflow: 'hidden'
      }}>
        {/* Left Sidebar - Node Palette */}
        <div 
          className="node-palette"
          style={{
            width: leftPanelCollapsed ? '0px' : `${leftPanelWidth}px`,
            transition: resizing === 'left' ? 'none' : 'width 0.2s ease',
            opacity: leftPanelCollapsed ? 0 : 1,
            overflow: 'hidden'
          }}
        >
          <div className="palette-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="palette-title">📦 Nodes</h3>
              <p className="palette-subtitle">Drag to create</p>
            </div>
            <button
              onClick={() => {
                setLeftPanelCollapsed(!leftPanelCollapsed);
                localStorage.setItem('workflowLeftPanelCollapsed', (!leftPanelCollapsed).toString());
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all 0.2s',
                marginLeft: '8px'
              }}
              title="Collapse panel"
            >
              ◄
            </button>
          </div>
          
          {/* Group nodes by category */}
          {['Trigger', 'AI', 'API', 'Data', 'Logic', 'Action', 'Output'].map(category => {
            const categoryNodes = AVAILABLE_NODES.filter(n => n.category === category);
            return (
              <div key={category} className="node-category">
                <h4 className="category-label">{category}</h4>
                <div className="node-grid">
                  {categoryNodes.map(node => (
                    <button
                      key={node.type}
                      className="node-btn"
                      onClick={() => addNode(node.type)}
                      style={{ borderLeftColor: node.color }}
                      title={`Add ${node.label}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('nodeType', node.type);
                      }}
                    >
                      <span className="node-icon">{node.icon}</span>
                      <span className="node-name">{node.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Left Divider */}
        {!leftPanelCollapsed && (
          <div
            onMouseDown={() => setResizing('left')}
            style={{
              width: '8px',
              background: 'linear-gradient(90deg, transparent, var(--border-dark), transparent)',
              cursor: 'col-resize',
              userSelect: 'none',
              transition: 'background-color 0.2s',
            }}
            title="Drag to resize left panel"
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)';
            }}
            onMouseLeave={(e) => {
              if (resizing !== 'left') {
                e.target.style.background = 'linear-gradient(90deg, transparent, var(--border-dark), transparent)';
              }
            }}
          />
        )}

        {/* Main Canvas Area */}
        <div className={`canvas-wrapper ${isPanning ? 'panning' : ''}`} ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="canvas-controls">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
              <input
                type="text"
                placeholder="Workflow name..."
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="workflow-name-input"
                style={{ flex: 1 }}
              />
              
              {agents.length > 0 && (
                <select
                  value={selectedAgent || ''}
                  onChange={(e) => setSelectedAgent(e.target.value || null)}
                  className="workflow-name-input"
                  style={{ flex: 1, maxWidth: '200px' }}
                  title="Assign agent for shell commands and automation"
                >
                  <option value="">No Agent</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      🤖 {agent.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Zoom Controls */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                className="save-btn"
                title="Zoom out (Ctrl+Scroll)"
                style={{ padding: '8px 12px' }}
              >
                🔍−
              </button>
              <span style={{ 
                minWidth: '50px', 
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                className="save-btn"
                title="Zoom in (Ctrl+Scroll)"
                style={{ padding: '8px 12px' }}
              >
                🔍+
              </button>
              <button 
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="save-btn"
                title="Reset zoom and pan"
                style={{ padding: '8px 12px' }}
              >
                ⌖ Reset
              </button>
            </div>

            <button 
              onClick={() => setSaveAsTaskType(true)} 
              disabled={nodes.length === 0 || saving}
              className="save-btn"
              title="Save this workflow as a custom task type"
            >
              ⭐ Save as Task Type
            </button>
            <button onClick={saveWorkflow} disabled={saving || nodes.length === 0} className="save-btn">
              {saving ? 'Saving...' : '💾 Save'}
            </button>
            <button onClick={executeWorkflow} disabled={executing || nodes.length === 0} className="execute-btn">
              {executing ? 'Executing...' : '▶️ Execute'}
            </button>
          </div>

          {/* Warnings Panel */}
          {workflowWarnings.length > 0 && (
            <div style={{
              padding: '12px 16px',
              background: '#7c2d12',
              borderBottom: '1px solid #92400e',
              overflow: 'auto',
              maxHeight: '80px'
            }}>
              <div style={{ fontSize: '12px', color: '#fed7aa', lineHeight: '1.6' }}>
                {workflowWarnings.map((warning, idx) => (
                  <div key={idx}>{warning}</div>
                ))}
              </div>
            </div>
          )}

          {/* SVG Canvas for Drawing Lines */}
          <svg ref={svgRef} className="workflow-svg" style={{
            position: 'absolute',
            top: '60px',
            left: '0',
            width: '100%',
            height: 'calc(100% - 60px)',
            pointerEvents: 'none',
            zIndex: 1,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left'
          }}></svg>

          {/* Nodes on Canvas - Full Page with Pan/Zoom */}
          <div className="nodes-container" ref={canvasRef} style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left'
          }}>
            {nodes.map(node => {
              const nodeConfig = AVAILABLE_NODES.find(n => n.type === node.type);
              return (
                <div
                  key={node.id}
                  className={`workflow-node ${selectedNode?.id === node.id ? 'selected' : ''} ${connectMode?.from === node.id ? 'connecting' : ''} node-type-${node.type}`}
                  style={{ 
                    left: `${node.x}px`, 
                    top: `${node.y}px`,
                    '--node-color': node.color || nodeConfig?.color || '#667eea'
                  }}
                  onClick={(e) => {
                    if (connectMode && connectMode.from !== node.id) {
                      finishConnection(node.id);
                    } else {
                      setSelectedNode(node);
                    }
                    e.stopPropagation();
                  }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={(e) => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                      const adjustedX = (e.clientX - rect.left - 50 - pan.x) / zoom;
                      const adjustedY = (e.clientY - rect.top - 50 - pan.y) / zoom;
                      updateNodePosition(node.id, adjustedX, adjustedY);
                    }
                  }}
                  onMouseEnter={() => {
                    if (connectMode?.from && connectMode.from !== node.id) {
                      setConnectMode({ ...connectMode, hoveredNode: node.id });
                    }
                  }}
                  onMouseLeave={() => {
                    if (connectMode) {
                      setConnectMode({ ...connectMode, hoveredNode: null });
                    }
                  }}
                >
                  {/* Node Visual */}
                  <div className="node-visual">
                    <div className="node-header" style={{
                      backgroundColor: node.color || nodeConfig?.color
                    }}>
                      <span className="node-icon-lg">{node.icon || nodeConfig?.icon}</span>
                    </div>
                    <div className="node-body">
                      <p className="node-label">{node.label}</p>
                      <p className="node-id">{node.id.replace('node-', '#')}</p>
                    </div>
                  </div>

                  {/* Connection Ports */}
                  <div className="port-input" title="Input" onClick={(e) => {
                    e.stopPropagation();
                    if (connectMode?.from && connectMode.from !== node.id) {
                      finishConnection(node.id);
                    }
                  }}></div>
                  <div className="port-output" title="Output" onClick={(e) => {
                    e.stopPropagation();
                    startConnection(node.id);
                  }}></div>

                  {/* Delete Button */}
                  <button
                    className="node-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(node.id);
                      toast.success('Node deleted');
                    }}
                    title="Delete node"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
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

        {/* Collapse Button for Left Panel */}
        {leftPanelCollapsed && (
          <button
            onClick={() => {
              setLeftPanelCollapsed(false);
              localStorage.setItem('workflowLeftPanelCollapsed', 'false');
            }}
            style={{
              position: 'absolute',
              left: '0',
              top: '60px',
              width: '32px',
              height: '32px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-dark)',
              borderRight: 'none',
              borderRadius: '0 8px 8px 0',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--bg-hover)';
              e.target.style.color = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--bg-card)';
              e.target.style.color = 'var(--text-secondary)';
            }}
            title="Show left panel"
          >
            ▶
          </button>
        )}
        
        {/* Right Divider */}
        {!rightPanelCollapsed && (
          <div
            onMouseDown={() => setResizing('right')}
            style={{
              width: '8px',
              background: 'linear-gradient(90deg, transparent, var(--border-dark), transparent)',
              cursor: 'col-resize',
              userSelect: 'none',
              transition: 'background-color 0.2s',
            }}
            title="Drag to resize right panel"
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)';
            }}
            onMouseLeave={(e) => {
              if (resizing !== 'right') {
                e.target.style.background = 'linear-gradient(90deg, transparent, var(--border-dark), transparent)';
              }
            }}
          />
        )}

        {/* Right Sidebar - Node Properties */}
        <div 
          className="node-properties"
          style={{
            width: rightPanelCollapsed ? '0px' : `${rightPanelWidth}px`,
            transition: resizing === 'right' ? 'none' : 'width 0.2s ease',
            opacity: rightPanelCollapsed ? 0 : 1,
            overflow: 'hidden'
          }}
        >
          <div className="properties-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>⚙️ Properties</h3>
            <button
              onClick={() => {
                setRightPanelCollapsed(!rightPanelCollapsed);
                localStorage.setItem('workflowRightPanelCollapsed', (!rightPanelCollapsed).toString());
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all 0.2s',
              }}
              title="Collapse panel"
            >
              ◀
            </button>
          </div>
          
          {selectedNode ? (
            <div className="properties-form">
              <div className="prop-section">
                <h4>Node Info</h4>
                <div className="prop-group">
                  <label>Type</label>
                  <input type="text" value={selectedNode.type} disabled className="prop-input" />
                </div>
                <div className="prop-group">
                  <label>ID</label>
                  <input type="text" value={selectedNode.id} disabled className="prop-input" />
                </div>
                <div className="prop-group">
                  <label>Position</label>
                  <p className="prop-info">X: {Math.round(selectedNode.x)}, Y: {Math.round(selectedNode.y)}</p>
                </div>
              </div>

              {/* Dynamic Properties Based on Node Type */}
              {['http_request', 'api_call', 'browser_open'].includes(selectedNode.type) && (
                <div className="prop-section">
                  <h4>URL Configuration</h4>
                  <div className="prop-group">
                    <label>URL</label>
                    <input
                      type="text"
                      placeholder="https://api.example.com/endpoint"
                      value={selectedNode.params?.url || ''}
                      onChange={(e) => {
                        setSelectedNode({
                          ...selectedNode,
                          params: { ...selectedNode.params, url: e.target.value }
                        });
                      }}
                      className="prop-input"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'shell' && (
                <div className="prop-section">
                  <h4>🖥️ Shell Command</h4>
                  <div className="prop-group">
                    <label>Command</label>
                    <textarea
                      placeholder="e.g., echo 'Hello World' or dir /s"
                      value={selectedNode.params?.command || ''}
                      onChange={(e) => {
                        setSelectedNode({
                          ...selectedNode,
                          params: { ...selectedNode.params, command: e.target.value }
                        });
                      }}
                      className="prop-textarea"
                      style={{ minHeight: '80px' }}
                    />
                  </div>
                  <div className="prop-group">
                    <label>Timeout (seconds)</label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      placeholder="30"
                      value={selectedNode.params?.timeout || 30}
                      onChange={(e) => {
                        setSelectedNode({
                          ...selectedNode,
                          params: { ...selectedNode.params, timeout: parseInt(e.target.value) }
                        });
                      }}
                      className="prop-input"
                    />
                  </div>
                  <div className="prop-group">
                    <label>Working Directory (optional)</label>
                    <input
                      type="text"
                      placeholder="/home/user or C:\\Users\\user"
                      value={selectedNode.params?.cwd || ''}
                      onChange={(e) => {
                        setSelectedNode({
                          ...selectedNode,
                          params: { ...selectedNode.params, cwd: e.target.value }
                        });
                      }}
                      className="prop-input"
                    />
                  </div>
                  {!selectedAgent && (
                    <div style={{
                      padding: '8px 12px',
                      background: '#7c2d12',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#fed7aa',
                      marginTop: '8px'
                    }}>
                      ⚠️ Assign an agent above to execute this command
                    </div>
                  )}
                </div>
              )}

              {selectedNode.type === 'condition' && (
                <div className="prop-section">
                  <h4>Condition</h4>
                  <div className="prop-group">
                    <label>Expression</label>
                    <input
                      type="text"
                      placeholder="status === 'success'"
                      value={selectedNode.params?.expression || ''}
                      onChange={(e) => {
                        setSelectedNode({
                          ...selectedNode,
                          params: { ...selectedNode.params, expression: e.target.value }
                        });
                      }}
                      className="prop-input"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'email' && (
                <div className="prop-section">
                  <h4>Email Config</h4>
                  <div className="prop-group">
                    <label>To</label>
                    <input
                      type="email"
                      placeholder="recipient@example.com"
                      value={selectedNode.params?.to || ''}
                      onChange={(e) => {
                        setSelectedNode({
                          ...selectedNode,
                          params: { ...selectedNode.params, to: e.target.value }
                        });
                      }}
                      className="prop-input"
                    />
                  </div>
                  <div className="prop-group">
                    <label>Subject</label>
                    <input
                      type="text"
                      placeholder="Email Subject"
                      value={selectedNode.params?.subject || ''}
                      onChange={(e) => {
                        setSelectedNode({
                          ...selectedNode,
                          params: { ...selectedNode.params, subject: e.target.value }
                        });
                      }}
                      className="prop-input"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'schedule' && (
                <div className="prop-section">
                  <h4>Cron Expression</h4>
                  <div className="prop-group">
                    <label>Cron</label>
                    <input
                      type="text"
                      placeholder="0 0 * * * (every day at midnight)"
                      value={selectedNode.params?.cron || ''}
                      onChange={(e) => {
                        setSelectedNode({
                          ...selectedNode,
                          params: { ...selectedNode.params, cron: e.target.value }
                        });
                      }}
                      className="prop-input"
                    />
                  </div>
                </div>
              )}

              <div className="prop-section">
                <h4>Actions</h4>
                <div className="prop-actions">
                  <button 
                    className={`connect-btn ${connectMode?.from === selectedNode.id ? 'active' : ''}`}
                    onClick={() => startConnection(selectedNode.id)}
                  >
                    {connectMode?.from === selectedNode.id ? '✖ Cancel' : '🔗 Connect'}
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => {
                      deleteNode(selectedNode.id);
                      setSelectedNode(null);
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>👆 Select a node to view properties</p>
            </div>
          )}

          {/* Workflow Stats */}
          <div className="workflow-stats">
            <div className="stat-item">
              <span className="stat-label">Nodes</span>
              <span className="stat-value">{nodes.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Connections</span>
              <span className="stat-value">{edges.length}</span>
            </div>
          </div>
        </div>
        
        {/* Collapse Button for Right Panel */}
        {rightPanelCollapsed && (
          <button
            onClick={() => {
              setRightPanelCollapsed(false);
              localStorage.setItem('workflowRightPanelCollapsed', 'false');
            }}
            style={{
              position: 'absolute',
              right: '0',
              top: '60px',
              width: '32px',
              height: '32px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-dark)',
              borderLeft: 'none',
              borderRadius: '8px 0 0 8px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--bg-hover)';
              e.target.style.color = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--bg-card)';
              e.target.style.color = 'var(--text-secondary)';
            }}
            title="Show right panel"
          >
            ◀
          </button>
        )}
      </div>

      {/* Save as Task Type Modal */}
      {saveAsTaskType && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a2332',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid #2d3e52'
          }}>
            <h2 style={{ color: '#e1e8f0', marginBottom: '16px', marginTop: 0 }}>
              💾 Save as Custom Task Type
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                color: '#a1aec8', 
                fontSize: '12px', 
                marginBottom: '6px',
                fontWeight: '600'
              }}>
                Task Type Icon
              </label>
              <input
                type="text"
                maxLength="2"
                value={taskTypeConfig.icon}
                onChange={(e) => setTaskTypeConfig({ ...taskTypeConfig, icon: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #2d3e52',
                  borderRadius: '8px',
                  background: '#0f1419',
                  color: '#e1e8f0',
                  fontSize: '32px',
                  textAlign: 'center'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                color: '#a1aec8', 
                fontSize: '12px', 
                marginBottom: '6px',
                fontWeight: '600'
              }}>
                Task Type Name
              </label>
              <input
                type="text"
                placeholder="e.g., Email Verification, Data Backup"
                value={taskTypeConfig.name}
                onChange={(e) => setTaskTypeConfig({ ...taskTypeConfig, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #2d3e52',
                  borderRadius: '8px',
                  background: '#0f1419',
                  color: '#e1e8f0',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                color: '#a1aec8', 
                fontSize: '12px', 
                marginBottom: '6px',
                fontWeight: '600'
              }}>
                Description (Optional)
              </label>
              <textarea
                placeholder="Describe what this task type does..."
                value={taskTypeConfig.description}
                onChange={(e) => setTaskTypeConfig({ ...taskTypeConfig, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #2d3e52',
                  borderRadius: '8px',
                  background: '#0f1419',
                  color: '#e1e8f0',
                  fontSize: '14px',
                  minHeight: '80px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ 
              padding: '12px', 
              background: '#0f1419', 
              borderRadius: '8px', 
              marginBottom: '20px',
              fontSize: '12px',
              color: '#a1aec8',
              lineHeight: '1.6'
            }}>
              <strong style={{ color: '#667eea' }}>Workflow Info:</strong><br/>
              📝 Name: {workflowName}<br/>
              📦 Nodes: {nodes.length}<br/>
              🔗 Connections: {edges.length}<br/>
              🤖 Agent: {selectedAgent ? agents.find(a => a.id === selectedAgent)?.name || 'Unknown' : 'Not assigned'}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSaveAsTaskType(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #2d3e52',
                  background: '#151d2b',
                  color: '#e1e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveWorkflowAsTaskType}
                disabled={saving || !taskTypeConfig.name.trim()}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: saving || !taskTypeConfig.name.trim() ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {saving ? 'Saving...' : '✅ Save as Task Type'}
              </button>
            </div>
          </div>
        </div>
      )}

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
