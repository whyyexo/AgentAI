import { useEffect, useState } from 'react';
import { Bot, TrendingUp, Activity, Zap } from 'lucide-react';
import { Agent, supabase } from '../lib/supabase';
import { StatsCard } from './StatsCard';
import { AgentCard } from './AgentCard';

type AgentsViewProps = {
  onCreateAgent: () => void;
  onChatWithAgent: (agent: Agent) => void;
  onConfigureAgent: (agent: Agent) => void;
};

export function AgentsView({ onCreateAgent, onChatWithAgent, onConfigureAgent }: AgentsViewProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAgents(data);
    }
    setLoading(false);
  };

  const handleToggleStatus = async (id: string) => {
    const agent = agents.find(a => a.id === id);
    if (!agent) return;

    const newStatus = agent.status === 'active' ? 'inactive' : 'active';

    const { error } = await supabase
      .from('agents')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setAgents(agents.map(a => a.id === id ? { ...a, status: newStatus } : a));
    }
  };


  const activeAgents = agents.filter(a => a.status === 'active').length;
  const totalCalls = agents.reduce((sum, a) => sum + a.api_calls, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-gray-400">Manage and monitor your AI agents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Agents"
          value={agents.length}
          change="+2 this week"
          icon={Bot}
          trend="up"
        />
        <StatsCard
          title="Active Agents"
          value={activeAgents}
          change={`${activeAgents} running`}
          icon={Activity}
          trend="up"
        />
        <StatsCard
          title="API Calls"
          value={totalCalls.toLocaleString()}
          change="+12.5% from last month"
          icon={TrendingUp}
          trend="up"
        />
        <StatsCard
          title="Connections"
          value={agents.length * 2}
          change="5 active"
          icon={Zap}
          trend="up"
        />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Your Agents</h3>
        {agents.length === 0 && (
          <button
            onClick={onCreateAgent}
            className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
          >
            Create your first agent
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No agents yet</h3>
          <p className="text-gray-400 mb-6">
            Create your first AI agent to get started
          </p>
          <button
            onClick={onCreateAgent}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 px-6 transition-colors font-medium"
          >
            Create Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onToggleStatus={handleToggleStatus}
              onChat={onChatWithAgent}
              onSettings={onConfigureAgent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
