import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Users, MessageSquare, Zap, Calendar, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ChartData = {
  date: string;
  messages: number;
  agents: number;
};

export function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMessages: 0,
    activeAgents: 0,
    totalAgents: 0,
    avgResponseTime: 0,
    messageGrowth: 0,
    agentGrowth: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const { data: agents } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id);

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*, agent_id')
      .gte('created_at', startDate.toISOString());

    const userMessages = messages?.filter(m =>
      agents?.some(a => a.id === m.agent_id)
    ) || [];

    const activeAgents = agents?.filter(a => a.status === 'active').length || 0;
    const totalAgents = agents?.length || 0;
    const totalMessages = agents?.reduce((sum, a) => sum + a.api_calls, 0) || 0;

    const messagesPerDay: { [key: string]: number } = {};
    const agentsPerDay: { [key: string]: number } = {};

    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      messagesPerDay[dateStr] = 0;
      agentsPerDay[dateStr] = 0;
    }

    userMessages.forEach(msg => {
      const dateStr = msg.created_at.split('T')[0];
      if (messagesPerDay[dateStr] !== undefined) {
        messagesPerDay[dateStr]++;
      }
    });

    const chartData: ChartData[] = Object.keys(messagesPerDay).map(date => ({
      date,
      messages: messagesPerDay[date],
      agents: agentsPerDay[date] || activeAgents,
    }));

    const avgMessages = chartData.reduce((sum, d) => sum + d.messages, 0) / chartData.length;
    const recentAvg = chartData.slice(-3).reduce((sum, d) => sum + d.messages, 0) / 3;
    const messageGrowth = avgMessages > 0 ? ((recentAvg - avgMessages) / avgMessages) * 100 : 0;

    setStats({
      totalMessages,
      activeAgents,
      totalAgents,
      avgResponseTime: 1.2,
      messageGrowth,
      agentGrowth: 12.5,
    });
    setChartData(chartData);
    setLoading(false);
  };

  const StatCard = ({ icon: Icon, label, value, change, trend }: any) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-500" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {change}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );

  const maxMessages = Math.max(...chartData.map(d => d.messages), 1);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h2>
        <p className="text-gray-400">Track your agents' performance and usage metrics</p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={MessageSquare}
              label="Total Messages"
              value={stats.totalMessages.toLocaleString()}
              change={`${stats.messageGrowth > 0 ? '+' : ''}${stats.messageGrowth.toFixed(1)}%`}
              trend={stats.messageGrowth >= 0 ? 'up' : 'down'}
            />
            <StatCard
              icon={Activity}
              label="Active Agents"
              value={stats.activeAgents}
              change={`+${stats.agentGrowth.toFixed(1)}%`}
              trend="up"
            />
            <StatCard
              icon={Users}
              label="Total Agents"
              value={stats.totalAgents}
            />
            <StatCard
              icon={Zap}
              label="Avg Response Time"
              value={`${stats.avgResponseTime}s`}
              change="-8.3%"
              trend="up"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Message Activity</h3>
                <BarChart3 className="w-5 h-5 text-gray-500" />
              </div>
              <div className="space-y-3">
                {chartData.map((data, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="text-xs text-gray-500 w-20">
                      {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 bg-gray-800 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${(data.messages / maxMessages) * 100}%` }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {data.messages} messages
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Top Performing Agents</h3>
                <Activity className="w-5 h-5 text-gray-500" />
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Customer Support Bot', calls: 1245, change: 23.5, trend: 'up' },
                  { name: 'Sales Assistant', calls: 892, change: 15.2, trend: 'up' },
                  { name: 'FAQ Handler', calls: 654, change: -5.3, trend: 'down' },
                  { name: 'Lead Qualifier', calls: 432, change: 8.7, trend: 'up' },
                ].map((agent, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <span className="text-blue-500 font-bold">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{agent.name}</div>
                        <div className="text-xs text-gray-400">{agent.calls} calls</div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      agent.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {agent.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {Math.abs(agent.change)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-white">Peak Hours</h3>
              </div>
              <div className="space-y-3">
                {['9:00 AM - 11:00 AM', '2:00 PM - 4:00 PM', '7:00 PM - 9:00 PM'].map((time, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-300">{time}</span>
                    <span className="text-sm font-medium text-blue-500">{Math.floor(Math.random() * 200 + 100)} msgs</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-white">Message Types</h3>
              </div>
              <div className="space-y-3">
                {[
                  { type: 'Questions', count: 45, color: 'bg-blue-500' },
                  { type: 'Commands', count: 30, color: 'bg-green-500' },
                  { type: 'Feedback', count: 15, color: 'bg-yellow-500' },
                  { type: 'Other', count: 10, color: 'bg-gray-500' },
                ].map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{item.type}</span>
                      <span className="text-sm font-medium text-white">{item.count}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.count}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-white">Integration Usage</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Slack', count: 234 },
                  { name: 'Discord', count: 189 },
                  { name: 'Telegram', count: 156 },
                  { name: 'WhatsApp', count: 98 },
                ].map((integration, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-300">{integration.name}</span>
                    <span className="text-sm font-medium text-blue-500">{integration.count} uses</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
