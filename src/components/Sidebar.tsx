import { Bot, Plus, Settings, BarChart3, Zap, CreditCard, LogOut, User, MessageSquare, Layers } from 'lucide-react';

type SidebarProps = {
  activeView: string;
  onViewChange: (view: string) => void;
  onCreateAgent: () => void;
  onSignOut: () => void;
  userEmail?: string;
};

export function Sidebar({ activeView, onViewChange, onCreateAgent, onSignOut, userEmail }: SidebarProps) {
  const menuItems = [
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'studio', label: 'Studio', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'ai-chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'connections', label: 'Connections', icon: Zap },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'pricing', label: 'Pricing', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-black border-r border-gray-800 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-500" />
          AI Agents
        </h1>
      </div>

      <div className="p-4">
        <button
          onClick={onCreateAgent}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Create Agent
        </button>
      </div>

      <nav className="flex-1 px-3 py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-900 rounded-lg p-3 mb-3">
          <p className="text-xs text-gray-500 mb-1">Signed in as</p>
          <p className="text-sm text-white font-medium truncate">{userEmail || 'Guest'}</p>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
