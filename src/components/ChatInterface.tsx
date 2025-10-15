import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User, X } from 'lucide-react';
import { Agent, ChatMessage, supabase } from '../lib/supabase';

type ChatInterfaceProps = {
  agent: Agent;
  onClose: () => void;
};

export function ChatInterface({ agent, onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [agent.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setInitialLoading(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
    }
    setInitialLoading(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      agent_id: agent.id,
      user_id: user.id,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    await supabase.from('chat_messages').insert({
      agent_id: agent.id,
      user_id: user.id,
      role: 'user',
      content: userMessage,
    });

    try {
      const { data: instructions } = await supabase
        .from('agent_instructions')
        .select('*')
        .eq('agent_id', agent.id)
        .maybeSingle();

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: instructions?.model || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: instructions?.system_prompt || 'You are a helpful AI assistant.',
            },
            ...messages.slice(-10).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content: userMessage },
          ],
          temperature: instructions?.temperature || 0.7,
          max_tokens: instructions?.max_tokens || 500,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from OpenAI');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        agent_id: agent.id,
        user_id: user.id,
        role: 'assistant',
        content: assistantMessage,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      await supabase.from('chat_messages').insert({
        agent_id: agent.id,
        user_id: user.id,
        role: 'assistant',
        content: assistantMessage,
      });

      await supabase
        .from('agents')
        .update({
          api_calls: agent.api_calls + 1,
          last_active: new Date().toISOString(),
        })
        .eq('id', agent.id);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        agent_id: agent.id,
        user_id: user.id,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure your OpenAI API key is configured correctly.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{agent.name}</h2>
              <p className="text-sm text-gray-400">{agent.description || 'AI Assistant'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {initialLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Start a conversation with {agent.name}</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-blue-500" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-blue-500" />
              </div>
              <div className="bg-gray-800 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-6 border-t border-gray-800">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 bg-black border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
