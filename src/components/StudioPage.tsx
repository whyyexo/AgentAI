import { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  BackgroundVariant,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, MessageSquare, Send, Database, Zap, Filter, Code, Bell, Brain, Search, Trash2, Download, Upload } from 'lucide-react';

const blockTypes = [
  {
    id: 'trigger',
    label: 'Triggers',
    blocks: [
      { type: 'discord-message', label: 'Discord Message', icon: MessageSquare, color: 'from-purple-600 to-purple-700' },
      { type: 'slack-message', label: 'Slack Message', icon: MessageSquare, color: 'from-blue-600 to-blue-700' },
      { type: 'webhook', label: 'Webhook', icon: Zap, color: 'from-green-600 to-green-700' },
      { type: 'schedule', label: 'Schedule', icon: Bell, color: 'from-yellow-600 to-yellow-700' },
    ],
  },
  {
    id: 'processing',
    label: 'Processing',
    blocks: [
      { type: 'analyze-context', label: 'Analyze Context', icon: Brain, color: 'from-cyan-600 to-cyan-700' },
      { type: 'filter', label: 'Filter Data', icon: Filter, color: 'from-orange-600 to-orange-700' },
      { type: 'extract-data', label: 'Extract Data', icon: Search, color: 'from-pink-600 to-pink-700' },
      { type: 'transform', label: 'Transform', icon: Code, color: 'from-indigo-600 to-indigo-700' },
    ],
  },
  {
    id: 'action',
    label: 'Actions',
    blocks: [
      { type: 'send-message', label: 'Send Message', icon: Send, color: 'from-blue-600 to-blue-700' },
      { type: 'database', label: 'Database Query', icon: Database, color: 'from-gray-600 to-gray-700' },
      { type: 'api-call', label: 'API Call', icon: Zap, color: 'from-green-600 to-green-700' },
      { type: 'notify', label: 'Send Notification', icon: Bell, color: 'from-red-600 to-red-700' },
    ],
  },
];

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 250, y: 100 },
    data: {
      label: 'Discord Message',
      type: 'discord-message',
      icon: MessageSquare,
      color: 'from-purple-600 to-purple-700',
      description: 'Triggered when a message is received'
    },
  },
];

const initialEdges: Edge[] = [];

const CustomNode = ({ data }: any) => {
  const Icon = data.icon;
  return (
    <div className="px-4 py-3 shadow-2xl rounded-xl border-2 border-gray-800 bg-gray-900 hover:border-blue-500 transition-all group min-w-[200px]">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 bg-gradient-to-br ${data.color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">{data.label}</div>
        </div>
      </div>
      <div className="text-xs text-gray-400">{data.description}</div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
        <div className="flex-1 h-2 bg-gray-800 rounded-full relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export function StudioPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#3b82f6',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const addBlock = (blockType: any) => {
    const id = `${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'custom',
      position: { x: Math.random() * 500 + 100, y: Math.random() * 500 + 100 },
      data: {
        label: blockType.label,
        type: blockType.type,
        icon: blockType.icon,
        color: blockType.color,
        description: 'Configure this block',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setShowBlockMenu(false);
  };

  const onSelectionChange = useCallback(({ nodes }: any) => {
    setSelectedNodes(nodes.map((n: Node) => n.id));
  }, []);

  const deleteSelected = () => {
    if (selectedNodes.length === 0) return;
    setNodes((nds) => nds.filter((n) => !selectedNodes.includes(n.id)));
    setEdges((eds) => eds.filter((e) => !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target)));
    setSelectedNodes([]);
  };

  const exportFlow = () => {
    const flow = { nodes, edges };
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-flow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFlow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const flow = JSON.parse(event.target.result);
          setNodes(flow.nodes);
          setEdges(flow.edges);
        } catch (error) {
          alert('Invalid flow file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="h-screen flex bg-black">
      <div className="w-80 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-2">Studio</h2>
          <p className="text-sm text-gray-400">Build your agent workflow</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {blockTypes.map((category) => (
            <div key={category.id}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {category.label}
              </h3>
              <div className="space-y-2">
                {category.blocks.map((block) => {
                  const Icon = block.icon;
                  return (
                    <button
                      key={block.type}
                      onClick={() => addBlock(block)}
                      className="w-full flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-lg transition-all text-left group"
                    >
                      <div className={`w-10 h-10 bg-gradient-to-br ${block.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                          {block.label}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-gray-600 group-hover:text-blue-500 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={exportFlow}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Flow
          </button>
          <button
            onClick={importFlow}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Flow
          </button>
          <button
            onClick={deleteSelected}
            disabled={selectedNodes.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected ({selectedNodes.length})
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          fitView
          className="bg-black"
          style={{ background: '#000000' }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#1f2937"
          />
          <Controls
            className="bg-gray-900 border border-gray-800 rounded-lg"
            style={{ button: { backgroundColor: '#111827', color: '#ffffff', borderBottom: '1px solid #1f2937' } }}
          />
          <MiniMap
            className="bg-gray-900 border border-gray-800 rounded-lg"
            nodeColor={(node) => {
              return '#3b82f6';
            }}
            maskColor="rgba(0, 0, 0, 0.8)"
          />
        </ReactFlow>

        <div className="absolute top-6 right-6 bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Agent Flow</div>
              <div className="text-xs text-gray-400">{nodes.length} blocks</div>
            </div>
          </div>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Ready to deploy</span>
            </div>
          </div>
        </div>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Empty Canvas</h3>
              <p className="text-gray-500">Add blocks from the left sidebar to start building</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
