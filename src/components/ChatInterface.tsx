import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, RefreshCw, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateResponse } from '../services/gemini';
import { useSpeech } from '../hooks/useSpeech';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello I am the Quad Father your Quadriplegia AI assistant. How can I help your life today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoSpeak, setIsAutoSpeak] = useState(true);
  const mainRef = useRef<HTMLElement>(null);
  const { isListening, transcript, startListening, speak, setTranscript } = useSpeech();

  const scrollToBottom = () => {
    if (mainRef.current) {
      mainRef.current.scrollTop = mainRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (transcript) {
      handleSend(transcript);
      setTranscript('');
    }
  }, [transcript]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const botResponse = await generateResponse(text);
    
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponse,
      sender: 'bot',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);

    if (isAutoSpeak) {
      speak(botResponse);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-6xl mx-auto bg-white shadow-2xl overflow-hidden border-x border-black/5">
      {/* Header */}
      <header className="p-2 border-b border-white/10 bg-blue-800 flex items-center z-10" role="banner">
        <div className="w-14 h-14 shrink-0" aria-hidden="true" />
        <div className="flex-1 text-center">
          <h1 className="text-xl font-serif italic font-bold text-white leading-tight">
            <span className="block">Quadriplegia Support</span>
            <span className="block">AI Assistant</span>
          </h1>
        </div>
        <div className="w-14 shrink-0" aria-hidden="true" />
      </header>

      {/* Top Controls & Input Area */}
      <div className="bg-gray-50 border-b border-black/5 shadow-sm z-20">
        <div className="flex justify-center items-center gap-6 px-6 py-4 max-w-4xl mx-auto">
          <button
            onClick={startListening}
            disabled={isListening || isLoading}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg focus-visible:ring-4 focus-visible:ring-blue-500 outline-none ${
              isListening 
                ? 'bg-green-500 text-white animate-pulse' 
                : 'bg-blue-800 text-white hover:bg-blue-900 active:scale-95 disabled:opacity-50'
            }`}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
            aria-pressed={isListening}
          >
            <Mic size={40} />
          </button>

          <button 
            onClick={() => setIsAutoSpeak(!isAutoSpeak)}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md focus-visible:ring-4 focus-visible:ring-blue-500 outline-none ${
              isAutoSpeak 
                ? 'bg-blue-800 text-white hover:bg-blue-900' 
                : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
            }`}
            title={isAutoSpeak ? "Auto-speak ON" : "Auto-speak OFF"}
            aria-label={isAutoSpeak ? "Turn off auto-speak" : "Turn on auto-speak"}
            aria-pressed={isAutoSpeak}
          >
            {isAutoSpeak ? <Volume2 size={36} /> : <VolumeX size={36} />}
          </button>

          <button 
            onClick={() => setMessages([messages[0]])}
            className="w-20 h-20 rounded-full flex items-center justify-center bg-blue-800 text-white hover:bg-blue-900 transition-all shadow-md focus-visible:ring-4 focus-visible:ring-blue-500 outline-none"
            title="Clear Chat"
            aria-label="Clear chat history"
          >
            <RefreshCw size={36} />
          </button>
        </div>

        <div className="px-6 pb-6 max-w-4xl mx-auto">
          <div className="w-full relative">
            <input
              type="text"
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder={isListening ? "Listening..." : "Type your question..."}
              disabled={isLoading}
              className="w-full p-4 pr-16 rounded-full bg-white border-[10px] border-blue-800 focus:ring-4 focus:ring-blue-800/20 text-base outline-none transition-all shadow-inner"
              aria-label="Message input"
              aria-busy={isLoading}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 text-blue-800 disabled:text-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-blue-800 rounded-full outline-none"
              aria-label="Send message"
            >
              <Send size={28} />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <main 
        ref={mainRef}
        className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="false"
        aria-label="Chat history"
      >
        <div role="list" className="space-y-5">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                role="listitem"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  message.sender === 'bot' ? 'justify-center' : 'justify-end'
                }`}
              >
              <div className={`flex gap-4 max-w-[85%] ${
                message.sender === 'bot' ? 'flex-col items-center text-center' : 'flex-row-reverse'
              }`}>
                <div className={`flex items-center justify-center shrink-0 overflow-hidden ${
                  message.sender === 'user' ? 'w-14 h-14 rounded-full bg-blue-800 text-white shadow-md border-2 border-blue-800/10' : 'w-14 h-14 rounded-full border-[6px] border-blue-800'
                }`} aria-hidden="true">
                  {message.sender === 'user' ? (
                    <User size={28} />
                  ) : (
                    <img 
                      src="/Logo.png" 
                      alt="Bot" 
                      className="w-full h-full object-contain p-1 bg-white"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div className={`p-4 px-5 rounded-2xl text-base leading-relaxed shadow-sm ${
                  message.sender === 'bot' 
                    ? 'bg-blue-800 text-white border border-blue-900/20 rounded-2xl' :
                    'bg-blue-800 text-white rounded-tr-none'
                }`}>
                  <span className="sr-only">{message.sender === 'user' ? 'You said: ' : 'Assistant said: '}</span>
                  <div className="markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, href, children, ...props }) => {
                          const getDomain = (url: string) => {
                            try {
                              const domain = new URL(url).hostname;
                              return domain.replace(/^www\./, '');
                            } catch {
                              return url;
                            }
                          };
                          const displayValue = href ? getDomain(href) : children;
                          return (
                            <a 
                              href={href} 
                              {...props} 
                              className="text-blue-200 underline hover:text-blue-100 transition-colors font-bold" 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              {displayValue}
                            </a>
                          );
                        },
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-md font-bold mb-2">{children}</h2>,
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>
                  {message.sender === 'user' && (
                    <div className="text-[10px] mt-2 opacity-50 uppercase tracking-tighter text-right">
                      <span className="sr-only">Sent at </span>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
        {isLoading && (
          <div className="flex justify-center" aria-live="assertive" role="status">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-[6px] border-blue-800" aria-hidden="true">
                <img 
                  src="/Logo.png" 
                  alt="" 
                  className="w-full h-full object-contain p-1 bg-white animate-pulse"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex gap-1">
                <span className="sr-only">Assistant is thinking...</span>
                <div className="w-2 h-2 bg-blue-800 rounded-full animate-bounce" aria-hidden="true" />
                <div className="w-2 h-2 bg-blue-800 rounded-full animate-bounce [animation-delay:0.2s]" aria-hidden="true" />
                <div className="w-2 h-2 bg-blue-800 rounded-full animate-bounce [animation-delay:0.4s]" aria-hidden="true" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Branding Footer */}
      <footer className="p-1 border-t border-white/10 bg-blue-800 flex items-center z-10" role="contentinfo">
        <div className="w-14 h-7 shrink-0" aria-hidden="true" />
        <div className="flex-1 text-center">
          <h2 className="text-xl font-serif italic font-bold text-white leading-tight">
            Quad Father
          </h2>
        </div>
        <div className="w-14 shrink-0" aria-hidden="true" />
      </footer>
    </div>
  );
};
