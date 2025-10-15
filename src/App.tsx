import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AgentsView } from './components/AgentsView';
import { CreateAgentModal } from './components/CreateAgentModal';
import { ChatInterface } from './components/ChatInterface';
import { AgentInstructionsPage } from './components/AgentInstructionsPage';
import { ConnectionsPage } from './components/ConnectionsPage';
import { PricingPage } from './components/PricingPage';
import { AuthPage } from './components/AuthPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { ProfilePage } from './components/ProfilePage';
import { AIChatPage } from './components/AIChatPage';
import { StudioPage } from './components/StudioPage';
import { Agent, supabase } from './lib/supabase';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('agents');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email || '');
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    setUserEmail(session?.user?.email || '');
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setActiveView('agents');
  };

  const handleCreateAgent = () => {
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleChatWithAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowChat(true);
  };

  const handleConfigureAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowInstructions(true);
  };

  const handleBackFromInstructions = () => {
    setShowInstructions(false);
    setSelectedAgent(null);
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={checkAuth} />;
  }

  if (showInstructions && selectedAgent) {
    return (
      <div className="min-h-screen bg-black flex">
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          onCreateAgent={handleCreateAgent}
          onSignOut={handleSignOut}
          userEmail={userEmail}
        />
        <div className="flex-1 overflow-auto">
          <AgentInstructionsPage
            agent={selectedAgent}
            onBack={handleBackFromInstructions}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onCreateAgent={handleCreateAgent}
        onSignOut={handleSignOut}
        userEmail={userEmail}
      />

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 overflow-auto">
          {activeView === 'agents' && (
            <AgentsView
              key={refreshKey}
              onCreateAgent={handleCreateAgent}
              onChatWithAgent={handleChatWithAgent}
              onConfigureAgent={handleConfigureAgent}
            />
          )}
          {activeView === 'analytics' && <AnalyticsPage />}
          {activeView === 'studio' && <StudioPage />}
          {activeView === 'ai-chat' && <AIChatPage />}
          {activeView === 'profile' && <ProfilePage />}
          {activeView === 'connections' && <ConnectionsPage />}
          {activeView === 'pricing' && <PricingPage onClose={() => setActiveView('agents')} />}
          {activeView === 'settings' && (
            <div className="p-8">
              <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
              <p className="text-gray-400">Settings view coming soon...</p>
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateAgentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showChat && selectedAgent && (
        <ChatInterface
          agent={selectedAgent}
          onClose={() => {
            setShowChat(false);
            setSelectedAgent(null);
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}

export default App;
