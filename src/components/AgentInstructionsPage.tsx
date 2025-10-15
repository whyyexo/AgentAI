import { useState, useEffect } from 'react';
import { Save, ArrowLeft, Sliders } from 'lucide-react';
import { Agent, AgentInstructions, supabase } from '../lib/supabase';

type AgentInstructionsPageProps = {
  agent: Agent;
  onBack: () => void;
};

export function AgentInstructionsPage({ agent, onBack }: AgentInstructionsPageProps) {
  const [instructions, setInstructions] = useState<AgentInstructions | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(500);
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInstructions();
  }, [agent.id]);

  const loadInstructions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('agent_instructions')
      .select('*')
      .eq('agent_id', agent.id)
      .maybeSingle();

    if (data) {
      setInstructions(data);
      setSystemPrompt(data.system_prompt);
      setTemperature(data.temperature);
      setMaxTokens(data.max_tokens);
      setModel(data.model);
    } else {
      setSystemPrompt('You are a helpful AI assistant.');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    if (instructions) {
      const { error } = await supabase
        .from('agent_instructions')
        .update({
          system_prompt: systemPrompt,
          temperature,
          max_tokens: maxTokens,
          model,
          updated_at: new Date().toISOString(),
        })
        .eq('id', instructions.id);

      if (error) {
        alert('Error updating instructions: ' + error.message);
      }
    } else {
      const { error } = await supabase.from('agent_instructions').insert({
        agent_id: agent.id,
        system_prompt: systemPrompt,
        temperature,
        max_tokens: maxTokens,
        model,
      });

      if (error) {
        alert('Error creating instructions: ' + error.message);
      }
    }

    setSaving(false);
    onBack();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to agents
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Sliders className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{agent.name}</h1>
            <p className="text-gray-400">Configure your agent's behavior</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Instructions</h3>
          <p className="text-sm text-gray-400 mb-4">
            Define how your agent should behave and respond. Be specific about its role, tone, and capabilities.
          </p>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful AI assistant specialized in..."
            rows={8}
            className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Model Settings</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast & Cost-effective)</option>
                <option value="gpt-4">GPT-4 (Most Capable)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo (Balanced)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Temperature: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Focused</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Response Length: {maxTokens} tokens
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Short</span>
                <span>Medium</span>
                <span>Long</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4">
          <p className="text-sm text-blue-400">
            <strong>Tip:</strong> Lower temperature values make responses more focused and deterministic.
            Higher values make responses more creative and varied.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 bg-gray-800 hover:bg-gray-750 text-white rounded-xl py-3 px-4 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-4 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Instructions'}
          </button>
        </div>
      </div>
    </div>
  );
}
