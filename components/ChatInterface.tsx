
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, RequirementsDoc } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  requirements: RequirementsDoc | null;
  isProcessing: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, requirements, isProcessing }) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleOptionClick = (option: string) => {
    if (!isProcessing) {
      onSendMessage(option);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white mb-2">Reflector Agent</h1>
        <p className="text-slate-400 text-sm">
          Collaborative Requirements Engineering. I will refine your request until we have a solid plan.
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                
                {/* MCQ Options (Only show for assistant) */}
                {msg.role === 'assistant' && msg.options && msg.options.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[90%] w-full">
                    {msg.options.map((option, optIdx) => (
                      <button
                        key={optIdx}
                        onClick={() => handleOptionClick(option)}
                        disabled={isProcessing || idx !== messages.length - 1} // Only active if it's the latest message
                        className={`text-sm px-4 py-3 rounded-xl border text-left transition-all duration-200 group relative overflow-hidden ${
                          idx !== messages.length - 1 
                            ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                            : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-slate-300 hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:text-white cursor-pointer active:scale-[0.98]'
                        }`}
                      >
                         <div className="flex items-center justify-between">
                            <span>{option}</span>
                            {idx === messages.length - 1 && (
                                <span className="opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity">
                                    →
                                </span>
                            )}
                         </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-slate-800 rounded-2xl p-4 rounded-bl-none flex gap-2 items-center border border-slate-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                  <span className="text-slate-400 text-sm ml-2">Analyzing...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer or select an option above..."
                disabled={isProcessing}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-colors placeholder:text-slate-600"
              />
              <button 
                type="submit" 
                disabled={isProcessing || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors shadow-lg shadow-blue-900/20"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Live Requirements Doc */}
        <div className="w-80 border-l border-slate-800 bg-slate-900 p-4 overflow-y-auto hidden md:block">
          <h3 className="text-xs font-bold uppercase text-slate-500 mb-4 tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Live Requirements
          </h3>
          {requirements ? (
            <div className="space-y-6 text-sm">
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <strong className="text-blue-400 block mb-2 text-xs uppercase tracking-wider">User Story</strong>
                <p className="text-slate-300 italic">"{requirements.userStory || "Pending..."}"</p>
              </div>
              <div>
                <strong className="text-purple-400 block mb-2 text-xs uppercase tracking-wider">Functional Reqs</strong>
                <ul className="list-none space-y-2">
                  {requirements.functionalRequirements.length > 0 ? requirements.functionalRequirements.map((r, i) => (
                      <li key={i} className="flex gap-2 text-slate-400 bg-slate-800/30 p-2 rounded text-xs">
                          <span className="text-purple-500/50">•</span>
                          {r}
                      </li>
                  )) : <li className="text-slate-600 italic">Pending...</li>}
                </ul>
              </div>
              <div>
                <strong className="text-green-400 block mb-2 text-xs uppercase tracking-wider">Non-Functional Reqs</strong>
                <ul className="list-none space-y-2">
                  {requirements.nonFunctionalRequirements.length > 0 ? requirements.nonFunctionalRequirements.map((r, i) => (
                      <li key={i} className="flex gap-2 text-slate-400 bg-slate-800/30 p-2 rounded text-xs">
                          <span className="text-green-500/50">•</span>
                          {r}
                      </li>
                  )) : <li className="text-slate-600 italic">Pending...</li>}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center mt-20 text-slate-700 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-slate-600 animate-spin"></div>
              <span className="text-xs font-mono">DRAFTING_IN_PROGRESS</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
