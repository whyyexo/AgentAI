import { useState, useEffect } from 'react';
import { User, Mail, Calendar, CreditCard, Shield, Bell, Key, Save, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'security' | 'notifications'>('general');

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    company: '',
    role: '',
    subscriptionTier: 'free',
    agentLimit: 1,
    apiCallsLimit: 100,
    createdAt: '',
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    agentStatus: true,
    weeklyReport: false,
    marketingEmails: false,
  });

  const [apiKey, setApiKey] = useState('sk_live_••••••••••••••••••••••••••••');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (userProfile) {
        setProfile({
          fullName: userProfile.full_name || '',
          email: userProfile.email || user.email || '',
          company: userProfile.company || '',
          role: userProfile.role || '',
          subscriptionTier: userProfile.subscription_tier || 'free',
          agentLimit: userProfile.agent_limit || 1,
          apiCallsLimit: userProfile.api_calls_limit || 100,
          createdAt: userProfile.created_at || user.created_at,
        });
      } else {
        setProfile({
          ...profile,
          email: user.email || '',
          createdAt: user.created_at,
        });
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: profile.fullName,
          company: profile.company,
          role: profile.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        alert('Error updating profile: ' + error.message);
      } else {
        alert('Profile updated successfully!');
      }
    }
    setSaving(false);
  };

  const generateNewApiKey = () => {
    if (confirm('Are you sure you want to generate a new API key? Your old key will be invalidated.')) {
      setApiKey('sk_live_' + Math.random().toString(36).substring(2, 34));
      alert('New API key generated!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Profile Settings</h2>
        <p className="text-gray-400">Manage your account settings and preferences</p>
      </div>

      <div className="flex gap-6">
        <div className="w-64 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white border border-gray-800'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-3xl font-bold text-white">
                      {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{profile.fullName || 'User'}</h3>
                    <p className="text-sm text-gray-400">{profile.email}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        profile.subscriptionTier === 'pro' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {profile.subscriptionTier === 'pro' ? 'Pro Member' : 'Free Plan'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile.fullName}
                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                        className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full bg-gray-800 border border-gray-800 rounded-lg px-4 py-2.5 text-gray-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={profile.company}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                        placeholder="Your company name"
                        className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        value={profile.role}
                        onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                        placeholder="Your role"
                        className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Usage Limits</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">Agents</span>
                      <span className="text-sm font-medium text-white">3 / {profile.agentLimit}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(3 / profile.agentLimit) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">API Calls this month</span>
                      <span className="text-sm font-medium text-white">67 / {profile.apiCallsLimit}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(67 / profile.apiCallsLimit) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Current Plan</h3>
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg mb-4">
                  <div>
                    <div className="text-xl font-bold text-white mb-1">{profile.subscriptionTier === 'pro' ? 'Pro Plan' : 'Free Plan'}</div>
                    <div className="text-sm text-gray-400">
                      {profile.subscriptionTier === 'pro' ? '$29/month' : 'No cost'}
                    </div>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                    {profile.subscriptionTier === 'pro' ? 'Manage Plan' : 'Upgrade to Pro'}
                  </button>
                </div>
                <p className="text-sm text-gray-400">
                  {profile.subscriptionTier === 'pro'
                    ? 'Your plan renews on January 15, 2026'
                    : 'Upgrade to unlock unlimited agents and messages'}
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center text-white font-bold text-xs">
                      VISA
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">•••• •••• •••• 4242</div>
                      <div className="text-xs text-gray-400">Expires 12/2026</div>
                    </div>
                  </div>
                  <button className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors">
                    Update
                  </button>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Billing History</h3>
                <div className="space-y-3">
                  {[
                    { date: '2025-10-01', amount: '$29.00', status: 'Paid' },
                    { date: '2025-09-01', amount: '$29.00', status: 'Paid' },
                    { date: '2025-08-01', amount: '$29.00', status: 'Paid' },
                  ].map((invoice, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-4">
                        <CreditCard className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium text-white">{invoice.amount}</div>
                          <div className="text-xs text-gray-400">{invoice.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-green-500">{invoice.status}</span>
                        <button className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors">
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">API Key</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Use this key to authenticate API requests. Keep it secure and never share it publicly.
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={apiKey}
                    readOnly
                    className="flex-1 bg-black border border-gray-800 rounded-lg px-4 py-2.5 text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(apiKey)}
                    className="bg-gray-800 hover:bg-gray-750 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={generateNewApiKey}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Update Password
                  </button>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-500 mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  {[
                    { key: 'emailAlerts', label: 'Email Alerts', description: 'Receive alerts about your agents activity' },
                    { key: 'agentStatus', label: 'Agent Status Updates', description: 'Get notified when agents go online or offline' },
                    { key: 'weeklyReport', label: 'Weekly Reports', description: 'Receive weekly performance summaries' },
                    { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive news and product updates' },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-white mb-1">{setting.label}</div>
                        <div className="text-xs text-gray-400">{setting.description}</div>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, [setting.key]: !notifications[setting.key as keyof typeof notifications] })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notifications[setting.key as keyof typeof notifications] ? 'bg-blue-600' : 'bg-gray-700'
                        }`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          notifications[setting.key as keyof typeof notifications] ? 'transform translate-x-6' : ''
                        }`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
