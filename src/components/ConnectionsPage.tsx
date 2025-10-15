import { useState, useEffect } from 'react';
import { Zap, Plus, Check, ExternalLink } from 'lucide-react';
import { AgentConnection, supabase } from '../lib/supabase';

const availableIntegrations = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Connect your agent to Slack channels',
    icon: '💬',
    category: 'Communication',
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Integrate with Discord servers',
    icon: '🎮',
    category: 'Communication',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Deploy your agent on Telegram',
    icon: '✈️',
    category: 'Communication',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Connect to WhatsApp Business',
    icon: '📱',
    category: 'Communication',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate workflows with 5000+ apps',
    icon: '⚡',
    category: 'Automation',
  },
  {
    id: 'make',
    name: 'Make',
    description: 'Visual automation platform',
    icon: '🔧',
    category: 'Automation',
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Read and write spreadsheet data',
    icon: '📊',
    category: 'Productivity',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync with Notion databases',
    icon: '📝',
    category: 'Productivity',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and invoicing',
    icon: '💳',
    category: 'Payments',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce store integration',
    icon: '🛍️',
    category: 'E-commerce',
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing automation',
    icon: '📧',
    category: 'Marketing',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM and marketing platform',
    icon: '🎯',
    category: 'CRM',
  },
];

export function ConnectionsPage() {
  const [connections, setConnections] = useState<AgentConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Communication', 'Automation', 'Productivity', 'Payments', 'E-commerce', 'Marketing', 'CRM'];

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('agent_connections')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setConnections(data);
    }
    setLoading(false);
  };

  const isConnected = (integrationId: string) => {
    return connections.some((conn) => conn.connection_name === integrationId && conn.is_active);
  };

  const handleConnect = async (integration: typeof availableIntegrations[0]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: agents } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!agents) {
      alert('Please create an agent first');
      return;
    }

    alert(`Connect to ${integration.name} - Coming soon! This will open the OAuth flow.`);
  };

  const filteredIntegrations = selectedCategory === 'All'
    ? availableIntegrations
    : availableIntegrations.filter((i) => i.category === selectedCategory);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Connections</h2>
        <p className="text-gray-400">Connect your agents to external services and platforms</p>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => {
            const connected = isConnected(integration.id);
            return (
              <div
                key={integration.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{integration.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {integration.name}
                      </h3>
                      <p className="text-sm text-gray-400">{integration.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <span className="text-xs text-gray-500">{integration.category}</span>
                  {connected ? (
                    <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Connected
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-12 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-8">
        <div className="flex items-start gap-4">
          <div className="bg-blue-500/10 p-3 rounded-xl">
            <Zap className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              Need a custom integration?
            </h3>
            <p className="text-gray-300 mb-4">
              We can build custom integrations for your specific needs. Contact our team to discuss your requirements.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              Request Integration
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
