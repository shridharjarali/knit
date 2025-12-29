
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
    <div className="h-full flex flex-col bg-slate-950 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <span className="text-3xl">🔮</span> Reflector Agent
          </h1>
          <p className="text-slate-400 text-sm">
            Collaborative Requirements Engineering
          </p>
        </div>
        {requirements && (
          <div className="hidden md:block px-4 py-2 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Requirements Status</div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${requirements.isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className={`text-sm font-medium ${requirements.isComplete ? 'text-emerald-400' : 'text-amber-400'}`}>
                {requirements.isComplete ? 'Ready for Execution' : 'Gathering Details'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 max-w-4xl mx-auto w-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}>
                <div className="flex items-end gap-3 max-w-[85%]">
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
                      🔮
                    </div>
                  )}
                  
                  <div className={`rounded-2xl p-5 shadow-md leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none shadow-blue-900/20' 
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700 shadow-slate-900/20'
                  }`}>
                    {msg.content}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                      👤
                    </div>
                  )}
                </div>
                
                {/* MCQ Options (Only show for assistant) */}
                {msg.role === 'assistant' && msg.options && msg.options.length > 0 && (
                  <div className="mt-4 ml-11 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[80%] w-full">
                    {msg.options.map((option, optIdx) => (
                      <button
                        key={optIdx}
                        onClick={() => handleOptionClick(option)}
                        disabled={isProcessing || idx !== messages.length - 1}
                        className={`text-sm px-4 py-3 rounded-xl border text-left transition-all duration-200 group relative overflow-hidden ${
                          idx !== messages.length - 1 
                            ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:text-white cursor-pointer active:scale-[0.98]'
                        }`}
                      >
                         <div className="flex items-center justify-between relative z-10">
                            <span>{option}</span>
                            {idx === messages.length - 1 && (
                                <span className="opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity transform translate-x-2 group-hover:translate-x-0">
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
              <div className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0 opacity-70">
                  🔮
                </div>
                <div className="bg-slate-800 rounded-2xl p-4 rounded-bl-none flex gap-2 items-center border border-slate-700">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                  <span className="text-slate-400 text-sm ml-2">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-6 pt-2">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your requirements..."
                disabled={isProcessing}
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-lg placeholder:text-slate-600"
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xl">↑</span>
              </button>
            </form>
            <p className="text-center text-xs text-slate-600 mt-3">
              AI can make mistakes. Review generated requirements carefully.
            </p>
          </div>
        </div>

        {/* Live Requirements Doc (Side Panel) */}
        <div className="w-80 border-l border-slate-800 bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto hidden xl:block">
          <h3 className="text-xs font-bold uppercase text-slate-500 mb-4 tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Live Requirements
          </h3>
          {requirements ? (
            <div className="space-y-6 text-sm">
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 shadow-sm">
                <strong className="text-blue-400 block mb-2 text-xs uppercase tracking-wider">User Story</strong>
                <p className="text-slate-300 italic leading-relaxed">"{requirements.userStory || "Pending..."}"</p>
              </div>
              <div>
                <strong className="text-purple-400 block mb-2 text-xs uppercase tracking-wider">Functional Reqs</strong>
                <ul className="list-none space-y-2">
                  {requirements.functionalRequirements.length > 0 ? requirements.functionalRequirements.map((r, i) => (
                      <li key={i} className="flex gap-2 text-slate-400 bg-slate-800/30 p-3 rounded-lg text-xs border border-slate-800/50">
                          <span className="text-purple-500/50 mt-0.5">•</span>
                          {r}
                      </li>
                  )) : <li className="text-slate-600 italic">Pending...</li>}
                </ul>
              </div>
              <div>
                <strong className="text-emerald-400 block mb-2 text-xs uppercase tracking-wider">Non-Functional Reqs</strong>
                <ul className="list-none space-y-2">
                  {requirements.nonFunctionalRequirements.length > 0 ? requirements.nonFunctionalRequirements.map((r, i) => (
                      <li key={i} className="flex gap-2 text-slate-400 bg-slate-800/30 p-3 rounded-lg text-xs border border-slate-800/50">
                          <span className="text-emerald-500/50 mt-0.5">•</span>
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
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
