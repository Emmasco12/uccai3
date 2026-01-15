import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Chat as GenAIChat, GenerateContentResponse } from "@google/genai";

// Declare globals for the CDN libraries
declare const marked: any;
declare const hljs: any;

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
  groundingMetadata?: any;
};

// Sidebar Component
const Sidebar = ({ onNewChat }: { onNewChat: () => void }) => (
  <div className="hidden md:flex flex-col w-[260px] h-full bg-[#171717] flex-none">
    <div className="p-3">
       <button onClick={onNewChat} className="flex items-center justify-between gap-2 px-3 py-2 w-full rounded-lg hover:bg-[#212121] text-sm font-medium text-gray-200 transition-colors text-left group">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white rounded-full h-6 w-6 flex items-center justify-center text-black">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <span>New chat</span>
          </div>
          <svg className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
       </button>
    </div>
    
    <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-gray-700">
        <div className="text-xs font-semibold text-gray-500 mb-2 px-2 pt-2">Today</div>
        {['Latest AI News', 'React 19 Features', 'Stock Market Trends'].map((item, i) => (
            <div key={i} className="px-2 py-2 text-sm text-gray-300 hover:bg-[#212121] rounded-lg cursor-pointer truncate transition-colors">
                {item}
            </div>
        ))}
        
        <div className="text-xs font-semibold text-gray-500 mb-2 px-2 pt-4">Previous 7 Days</div>
        {['Weekly Meal Prep', 'Debug Python Script', 'Tokyo Travel Guide'].map((item, i) => (
            <div key={i + 10} className="px-2 py-2 text-sm text-gray-300 hover:bg-[#212121] rounded-lg cursor-pointer truncate transition-colors">
                {item}
            </div>
        ))}
    </div>

    <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-3 hover:bg-[#212121] rounded-lg cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/20">
                JD
            </div>
            <div className="flex-1">
                <div className="text-sm font-medium text-white">John Doe</div>
                <div className="text-xs text-gray-500">Free Plan</div>
            </div>
        </div>
    </div>
  </div>
);

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Render markdown content safely
  const renderContent = () => {
    if (isUser) return <p className="whitespace-pre-wrap">{message.text}</p>;
    
    // If no text yet and streaming
    if (!message.text && message.isStreaming) {
      return (
        <div className="flex space-x-1 items-center h-6">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        </div>
      );
    }

    // Parse markdown
    const html = marked.parse(message.text);
    return (
        <div>
            <div className="prose prose-invert prose-sm max-w-none text-[#ececec]" dangerouslySetInnerHTML={{ __html: html }} />
            
            {/* Render Grounding Sources */}
            {message.groundingMetadata?.groundingChunks && (
                <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-gray-400 mb-2">Sources</div>
                    <div className="flex flex-wrap gap-2">
                        {message.groundingMetadata.groundingChunks.map((chunk: any, idx: number) => {
                            if (chunk.web) {
                                return (
                                    <a 
                                        key={idx} 
                                        href={chunk.web.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-[#212121] hover:bg-[#333] border border-white/10 rounded-full px-3 py-1.5 text-xs text-gray-300 transition-colors max-w-full truncate"
                                    >
                                        <span className="truncate max-w-[150px]">{chunk.web.title}</span>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                    </a>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className={`flex w-full px-4 md:px-0 max-w-3xl mx-auto py-6 ${isUser ? '' : ''}`}>
      <div className={`flex w-full gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ring-1 ring-white/10 ${
          isUser 
            ? 'hidden' // Hide user avatar in ChatGPT style usually, or keep it minimal
            : 'bg-white text-black'
        }`}>
          {isUser ? '' : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>}
        </div>

        {/* Bubble */}
        <div 
          className={`relative max-w-[90%] md:max-w-[85%] ${
            isUser 
              ? 'bg-[#2f2f2f] text-white px-5 py-2.5 rounded-3xl' 
              : 'text-[#ececec] px-1'
          }`}
        >
          {!isUser && (
              <div className="text-xs font-bold mb-1 opacity-90">UCCAI</div>
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref to persist the chat session across renders
  const chatSessionRef = useRef<GenAIChat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize chat session
  useEffect(() => {
    try {
      // Get current date for the system prompt
      const today = new Date();
      const dateString = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      chatSessionRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are UCCAI, a helpful, intelligent, and precise AI assistant. 
          Current Date: ${dateString}.
          You answer questions clearly and concisely. You format your answers using Markdown.
          
          About the Founder:
          Emmanuel Agyemang is the founder of [UCCAI.online](https://www.uccai.online), a platform dedicated to innovation and technology solutions. He is currently pursuing a BSc in Economics with Finance at the University of Cape Coast, while also working as a skilled software developer. Known for his humility, calm nature, and strong faith in God, Emmanuel balances academics and technology with purpose. His elder brother, Daniel Agyemang, is pursuing BSc in Computer Science in the UK, showing that tech talent runs in the family.`,
          tools: [{googleSearch: {}}], // Enable Google Search for real-time updates
        }
      });
    } catch (error) {
      console.error("Failed to initialize chat:", error);
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Handle New Chat
  const handleNewChat = () => {
      setMessages([]);
      // Re-initialize chat session to clear history context
      try {
        const today = new Date();
        const dateString = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        chatSessionRef.current = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
              systemInstruction: `You are UCCAI, a helpful, intelligent, and precise AI assistant. 
              Current Date: ${dateString}.
              You answer questions clearly and concisely. You format your answers using Markdown.

              About the Founder:
              Emmanuel Agyemang is the founder of [UCCAI.online](https://www.uccai.online), a platform dedicated to innovation and technology solutions. He is currently pursuing a BSc in Economics with Finance at the University of Cape Coast, while also working as a skilled software developer. Known for his humility, calm nature, and strong faith in God, Emmanuel balances academics and technology with purpose. His elder brother, Daniel Agyemang, is pursuing BSc in Computer Science in the UK, showing that tech talent runs in the family.`,
              tools: [{googleSearch: {}}],
            }
        });
      } catch (error) {
          console.error("Failed to reset chat:", error);
      }
  };

  // Handle message sending
  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading || !chatSessionRef.current) return;

    setInput("");
    setIsLoading(true);
    
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';

    // Add user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: textToSend }]);

    // Prepare placeholder for AI response
    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'model', text: "", isStreaming: true }]);

    try {
      // Send stream request
      const streamResult = await chatSessionRef.current.sendMessageStream({ message: textToSend });
      
      let fullText = "";
      let collectedGroundingMetadata: any = null;
      
      for await (const chunk of streamResult) {
        const c = chunk as GenerateContentResponse;
        const chunkText = c.text || "";
        fullText += chunkText;
        
        // Capture grounding metadata if present in this chunk
        if (c.candidates?.[0]?.groundingMetadata) {
            collectedGroundingMetadata = c.candidates[0].groundingMetadata;
        }

        // Update the last message with new content and potential grounding data
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId ? { ...msg, text: fullText, groundingMetadata: collectedGroundingMetadata } : msg
        ));
      }

      // Mark streaming as done
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
      ));

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, text: "Sorry, I encountered an error processing your request.", isStreaming: false } 
          : msg
      ));
    } finally {
      setIsLoading(false);
      // Refocus input after sending (on desktop)
      if (window.innerWidth > 768) {
          inputRef.current?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full w-full bg-[#212121] text-[#ececec] font-sans overflow-hidden">
        
      {/* Sidebar */}
      <Sidebar onNewChat={handleNewChat} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative w-full min-w-0">
        
        {/* Header / Top Bar (Non-Absolute to simplify layout or Absolute with spacer) */}
        {/* Using absolute header but ensuring scroll container has top padding or transparency is managed */}
        <div className="absolute top-0 left-0 right-0 p-3 z-20 flex justify-between items-center md:justify-start bg-[#212121]/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none pointer-events-none md:pointer-events-auto">
            <div className="md:hidden pointer-events-auto">
                 <button className="p-2 text-gray-400 hover:text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
            </div>
            <button className="pointer-events-auto flex items-center gap-1.5 text-lg font-semibold text-gray-200 px-3 py-2 rounded-xl hover:bg-[#2f2f2f] transition-colors cursor-pointer ml-auto md:ml-0 mr-auto md:mr-0">
                <span>UCCAI</span>
                <span className="text-gray-500 text-lg">3.0 Flash</span>
                <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="w-10 md:hidden"></div> {/* spacer */}
        </div>

        {/* Scrollable Area - Use Flex-1 and min-h-0 to allow scrolling inside flex item */}
        <div className="flex-1 overflow-y-auto w-full relative min-h-0 scroll-smooth pt-16 md:pt-14">
            {messages.length === 0 ? (
                <div className="min-h-full flex flex-col items-center justify-center p-4">
                        <div className="w-16 h-16 bg-white rounded-full mb-6 flex items-center justify-center shadow-lg animate-fade-in-up">
                            {/* Logo */}
                            <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center text-white">What can I help with?</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                        <button onClick={() => handleSend("What is the latest news today?")} className="p-4 rounded-xl border border-white/10 hover:bg-[#2f2f2f] text-left transition-all hover:border-white/20 group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-medium text-sm text-gray-200">Latest News</div>
                                    <div className="text-xs text-gray-500 mt-1">Get today's top headlines</div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 p-1 rounded">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                </div>
                            </div>
                        </button>
                        <button onClick={() => handleSend("Draft a professional email")} className="p-4 rounded-xl border border-white/10 hover:bg-[#2f2f2f] text-left transition-all hover:border-white/20 group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-medium text-sm text-gray-200">Draft an email</div>
                                    <div className="text-xs text-gray-500 mt-1">requesting a deadline extension</div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 p-1 rounded">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                </div>
                            </div>
                        </button>
                        <button onClick={() => handleSend("Explain quantum computing")} className="hidden md:block p-4 rounded-xl border border-white/10 hover:bg-[#2f2f2f] text-left transition-all hover:border-white/20 group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-medium text-sm text-gray-200">Explain quantum computing</div>
                                    <div className="text-xs text-gray-500 mt-1">in simple terms</div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 p-1 rounded">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                </div>
                            </div>
                        </button>
                        <button onClick={() => handleSend("Debug this React code")} className="hidden md:block p-4 rounded-xl border border-white/10 hover:bg-[#2f2f2f] text-left transition-all hover:border-white/20 group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-medium text-sm text-gray-200">Debug code</div>
                                    <div className="text-xs text-gray-500 mt-1">find errors in a snippet</div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 p-1 rounded">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                </div>
                            </div>
                        </button>
                        </div>
                </div>
            ) : (
                <div className="w-full min-h-full pb-4">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            )}
        </div>

        {/* Static Input Area (Footer) - Ensures layout stability and scrolling */}
        <div className="flex-none p-4 w-full bg-[#212121] z-10">
            <div className="max-w-3xl mx-auto">
                <div className="bg-[#2f2f2f] rounded-[26px] p-3 shadow-xl relative border border-white/5 focus-within:border-white/10 transition-colors">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message UCCAI"
                        className="w-full bg-transparent text-[#ececec] placeholder-gray-400 text-base px-3 py-1 min-h-[44px] max-h-[200px] resize-none focus:outline-none"
                        rows={1}
                        style={{ height: 'auto' }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                        }}
                    />
                    <div className="flex justify-between items-center mt-2 px-2">
                        <div className="flex gap-2 text-gray-400">
                             <button className="p-2 hover:bg-[#424242] rounded-full transition-colors hover:text-white" title="Attach file">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                             </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className={`p-2 rounded-full transition-all duration-200 ${
                                    input.trim() && !isLoading
                                    ? "bg-white text-black hover:bg-gray-200 shadow-md"
                                    : "bg-[#676767]/30 text-gray-500 cursor-not-allowed"
                                }`}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-3">
                    <p className="text-[11px] text-gray-500">
                        UCCAI can make mistakes. Check important info.
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

// Initialize app
const root = createRoot(document.getElementById("root")!);
root.render(<App />);