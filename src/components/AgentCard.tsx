import { Bot, MessageSquare, Settings, Activity, Power, PowerOff } from 'lucide-react';
import { Agent } from '../lib/supabase';

type AgentCardProps = {
  agent: Agent;
  onToggleStatus: (id: string) => void;
  onChat: (agent: Agent) => void;
  onSettings: (agent: Agent) => void;
};

export function AgentCard({ agent, onToggleStatus, onChat, onSettings }: AgentCardProps) {
  const statusColors = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    training: 'bg-yellow-500',
  };

  const typeLabels = {
    chatbot: 'Chatbot',
    assistant: 'Assistant',
    automation: 'Automation',
    custom: 'Custom',
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500/10 p-3 rounded-lg">
            <Bot className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {agent.name}
            </h3>
            <p className="text-sm text-gray-400 mt-1">{agent.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSettings(agent)}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChat(agent)}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            title="Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`}></div>
          <span className="text-sm text-gray-400 capitalize">{agent.status}</span>
        </div>
        <div className="text-sm text-gray-500">
          {typeLabels[agent.type]}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Activity className="w-4 h-4" />
          <span>{agent.api_calls.toLocaleString()} calls</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(agent.id);
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            agent.status === 'active'
              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
              : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
          }`}
        >
          {agent.status === 'active' ? (
            <>
              <PowerOff className="w-4 h-4" />
              Stop
            </>
          ) : (
            <>
              <Power className="w-4 h-4" />
              Start
            </>
          )}
        </button>
      </div>
    </div>
  );
}
