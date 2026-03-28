import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Chat as GenAIChat, GenerateContentResponse } from "@google/genai";
import { 
  Plus, 
  MessageSquare, 
  PanelLeft, 
  ChevronDown, 
  Paperclip, 
  ArrowUp, 
  X, 
  Info, 
  User, 
  ExternalLink,
  Mail,
  Globe,
  Sparkles,
  Search,
  Code,
  Mail as MailIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Declare globals for the CDN libraries
declare const marked: any;
declare const hljs: any;

// Initialize the API client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
  images?: string[]; 
};

type Attachment = {
  file: File;
  previewUrl: string;
};

// --- Chat Interface Components ---

// Sidebar Component
const Sidebar = ({ onNewChat, onShowFounder, onSelectItem, isOpen, onClose }: { onNewChat: () => void, onShowFounder: () => void, onSelectItem: (item: string) => void, isOpen: boolean, onClose: () => void }) => {
  return (
  <>
    {/* Mobile Overlay Backdrop */}
    <div 
      className={`fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 md:hidden ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    />

    {/* Sidebar Container */}
    <motion.div 
      initial={false}
      animate={{ x: isOpen || window.innerWidth >= 768 ? 0 : -260 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={`
        fixed inset-y-0 left-0 z-40 w-[260px] h-full bg-[#171717] flex flex-col md:static md:inset-auto md:flex-none border-r border-white/5 md:border-none
      `}
    >
      <div className="p-3">
         <button 
            onClick={() => {
                onNewChat();
                if (window.innerWidth < 768) onClose();
            }} 
            className="flex items-center justify-between gap-2 px-3 py-2 w-full rounded-lg hover:bg-[#212121] text-sm font-medium text-gray-200 transition-colors text-left group"
         >
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white rounded-full h-6 w-6 flex items-center justify-center text-black">
                  <Plus size={14} strokeWidth={3} />
              </div>
              <span>New chat</span>
            </div>
            <MessageSquare size={14} className="text-gray-500 opacity-0 group-hover:opacity-100" />
         </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-gray-700">
          <div className="text-xs font-semibold text-gray-500 mb-2 px-2 pt-2 uppercase tracking-wider flex justify-between items-center">
              <span>Today</span>
              <span className="text-[10px] opacity-60 font-normal">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          {['Latest AI News', 'React 19 Features', 'Stock Market Trends'].map((item, i) => (
              <div 
                key={i} 
                onClick={() => onSelectItem(item)}
                className="px-2 py-2 text-sm text-gray-300 hover:bg-[#212121] rounded-lg cursor-pointer truncate transition-colors flex items-center gap-2"
              >
                  <MessageSquare size={14} className="text-gray-500" />
                  {item}
              </div>
          ))}
          
          <div className="text-xs font-semibold text-gray-500 mb-2 px-2 pt-4 uppercase tracking-wider">Previous 7 Days</div>
          {['Weekly Meal Prep', 'Debug Python Script', 'Tokyo Travel Guide'].map((item, i) => (
              <div 
                key={i + 10} 
                onClick={() => onSelectItem(item)}
                className="px-2 py-2 text-sm text-gray-300 hover:bg-[#212121] rounded-lg cursor-pointer truncate transition-colors flex items-center gap-2"
              >
                  <MessageSquare size={14} className="text-gray-500" />
                  {item}
              </div>
          ))}
      </div>

      <div className="p-3 border-t border-white/5 space-y-1">
          <button 
            onClick={onShowFounder}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg hover:bg-[#212121] text-sm text-gray-400 transition-colors"
          >
            <User size={16} />
            <span>About Founder</span>
          </button>
          <button 
            onClick={() => window.open('https://uccai.online', '_blank')}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg hover:bg-[#212121] text-sm text-gray-400 transition-colors"
          >
            <Globe size={16} />
            <span>Visit Website</span>
          </button>
      </div>
    </motion.div>
  </>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Safe markdown parsing
  const getHtml = (text: string) => {
    try {
        if (typeof marked !== 'undefined' && marked.parse) {
            return marked.parse(text);
        }
    } catch (e) {
        console.error("Markdown parsing failed", e);
    }
    return text;
  };

  // Render content
  const htmlContent = getHtml(message.text);

  return (
    <div className={`flex w-full px-4 md:px-0 max-w-3xl mx-auto py-6 ${isUser ? '' : ''}`}>
      <div className={`flex w-full gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ring-1 ring-white/10 ${
          isUser 
            ? 'hidden' // Hide user avatar in ChatGPT style
            : 'bg-white text-black'
        }`}>
          {isUser ? '' : <Sparkles size={16} />}
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
          
          {/* Images/Attachments in History (Simple view) */}
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.images.map((img, idx) => (
                <div key={idx} className="relative h-24 w-24 rounded-lg overflow-hidden border border-white/10">
                   <img src={img} alt="User upload" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Text Content */}
          {!message.text && message.isStreaming ? (
            <div className="flex space-x-1 items-center h-6">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            </div>
          ) : (
            <div>
                 <div className="prose prose-invert prose-sm max-w-none text-[#ececec]" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper to convert File to Gemini Part
const fileToPart = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                const base64Data = reader.result.split(',')[1];
                resolve({
                    inlineData: {
                        data: base64Data,
                        mimeType: file.type
                    }
                });
            } else {
                reject(new Error("Failed to read file"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFounderModal, setShowFounderModal] = useState(false);
  
  // Ref to persist the chat session across renders
  const chatSessionRef = useRef<GenAIChat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize chat session
  useEffect(() => {
    try {
      if (!GEMINI_API_KEY) {
        throw new Error("API key is missing. Please set GEMINI_API_KEY in your environment variables.");
      }
      // Get current date for the system prompt
      const today = new Date();
      const dateString = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      chatSessionRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingBudget: 0 }, // Speed optimization: Disable thinking
          systemInstruction: `You are UCCAI, a helpful, intelligent, and precise AI assistant. 
          Current Date: ${dateString}.
          You have access to Google Search to provide real-time information and the latest news.
          You answer questions clearly and concisely. You format your answers using Markdown.
          You can analyze images and documents provided by the user.
          
          About the Founder:
          When asked about the founder, you MUST provide this exact information:
          **Emmanuel Agyemang** is the founder of **UCCAI.online** (uccai.online) and a passionate software developer dedicated to using technology to support learning and innovation. He is currently pursuing a **Bachelor of Science (BSc) in Economics with Finance at the University of Cape Coast (UCC)**.
          
          Emmanuel is known for his simple, kind, and respectful personality. With a strong interest in technology and digital solutions, he aims to create platforms that empower students and communities through knowledge, collaboration, and innovation.
          
          He comes from a family that values education and technological advancement. His elder brother, **Daniel Agyen**, is currently pursuing a **Master’s degree in Computer Science**, which continues to inspire Emmanuel’s journey in the technology field.
          
          For inquiries, collaboration, or opportunities, you can reach Emmanuel at:
          **Email:** [emmasco2025@gmail.com](mailto:emmasco2025@gmail.com)
          **Website:** uccai.online`,
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
      setAttachments([]);
      // Re-initialize chat session to clear history context
      try {
      if (!GEMINI_API_KEY) {
        throw new Error("API key is missing. Please set GEMINI_API_KEY in your environment variables.");
      }
      const today = new Date();
        const dateString = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        chatSessionRef.current = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
              tools: [{ googleSearch: {} }],
              thinkingConfig: { thinkingBudget: 0 }, // Speed optimization: Disable thinking
              systemInstruction: `You are UCCAI, a helpful, intelligent, and precise AI assistant. 
              Current Date: ${dateString}.
              You have access to Google Search to provide real-time information and the latest news.
              You answer questions clearly and concisely. You format your answers using Markdown.
              You can analyze images and documents provided by the user.

              About the Founder:
              When asked about the founder, you MUST provide this exact information:
              **Emmanuel Agyemang** is the founder of **UCCAI.online** (uccai.online) and a passionate software developer dedicated to using technology to support learning and innovation. He is currently pursuing a **Bachelor of Science (BSc) in Economics with Finance at the University of Cape Coast (UCC)**.
              
              Emmanuel is known for his simple, kind, and respectful personality. With a strong interest in technology and digital solutions, he aims to create platforms that empower students and communities through knowledge, collaboration, and innovation.
              
              He comes from a family that values education and technological advancement. His elder brother, **Daniel Agyen**, is currently pursuing a **Master’s degree in Computer Science**, which continues to inspire Emmanuel’s journey in the technology field.
              
              For inquiries, collaboration, or opportunities, you can reach Emmanuel at:
              **Email:** [emmasco2025@gmail.com](mailto:emmasco2025@gmail.com)
              **Website:** uccai.online`,
            }
        });
        
        // Focus input after new chat
        setTimeout(() => inputRef.current?.focus(), 100);
      } catch (error) {
          console.error("Failed to reset chat:", error);
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newAttachments: Attachment[] = [];
          Array.from(e.target.files).forEach((file: File) => {
              newAttachments.push({
                  file,
                  previewUrl: URL.createObjectURL(file)
              });
          });
          setAttachments(prev => [...prev, ...newAttachments]);
      }
      // Reset input value to allow selecting the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => {
          const newAtts = [...prev];
          URL.revokeObjectURL(newAtts[index].previewUrl); // Cleanup memory
          newAtts.splice(index, 1);
          return newAtts;
      });
  };

  // Handle message sending
  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    // Allow sending if there's text OR attachments
    if ((!textToSend.trim() && attachments.length === 0) || isLoading || !chatSessionRef.current) return;

    setInput("");
    const currentAttachments = [...attachments];
    setAttachments([]); // Clear attachments from UI immediately
    setIsLoading(true);
    
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';

    // Add user message
    const userMsgId = Date.now().toString();
    const displayImages = currentAttachments.map(a => a.previewUrl);
    
    setMessages(prev => [...prev, { 
        id: userMsgId, 
        role: 'user', 
        text: textToSend,
        images: displayImages // Save preview URLs for history
    }]);

    // Prepare placeholder for AI response
    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'model', text: "", isStreaming: true }]);

    try {
      if (!GEMINI_API_KEY) {
        throw new Error("API key is missing. Please set GEMINI_API_KEY in your environment variables.");
      }
      // Prepare Parts for API
      const parts: any[] = [];
      
      // Process attachments in parallel for speed
      if (currentAttachments.length > 0) {
        const processedParts = await Promise.all(currentAttachments.map(att => fileToPart(att.file)));
        parts.push(...processedParts);
      }

      // Add text part if exists
      if (textToSend.trim()) {
          parts.push({ text: textToSend });
      }

      // Send request (passing parts array as message)
      const streamResult = await chatSessionRef.current.sendMessageStream({ message: parts });
      
      let fullText = "";
      
      for await (const chunk of streamResult) {
        const c = chunk as GenerateContentResponse;
        const chunkText = c.text || "";
        fullText += chunkText;

        // Update the last message with new content
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId ? { ...msg, text: fullText } : msg
        ));
      }

      // Mark streaming as done
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
      ));

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, text: `**Error:** ${errorMessage}\n\n*Please ensure your API key is correctly set in Vercel as GEMINI_API_KEY and that you have triggered a new deployment.*`, isStreaming: false } 
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
      <Sidebar 
        onNewChat={handleNewChat} 
        onShowFounder={() => {
            setShowFounderModal(true);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
        }}
        onSelectItem={(item) => {
            handleSend(item);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Founder Modal */}
      <AnimatePresence>
        {showFounderModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowFounderModal(false)}
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-[#2f2f2f] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-white/10"
                >
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Emmanuel Agyemang</h3>
                                    <p className="text-sm text-gray-400">Founder of UCCAI.online</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowFounderModal(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                            <p>
                                <strong className="text-white">Emmanuel Agyemang</strong> is the founder of <strong className="text-white">UCCAI.online</strong> (uccai.online) and a passionate software developer dedicated to using technology to support learning and innovation. He is currently pursuing a <strong className="text-white">Bachelor of Science (BSc) in Economics with Finance at the University of Cape Coast (UCC)</strong>.
                            </p>
                            <p>
                                Emmanuel is known for his simple, kind, and respectful personality. With a strong interest in technology and digital solutions, he aims to create platforms that empower students and communities through knowledge, collaboration, and innovation.
                            </p>
                            <p>
                                He comes from a family that values education and technological advancement. His elder brother, <strong className="text-white">Daniel Agyen</strong>, is currently pursuing a <strong className="text-white">Master’s degree in Computer Science</strong>, which continues to inspire Emmanuel’s journey in the technology field.
                            </p>
                            
                            <div className="pt-4 border-t border-white/5 space-y-2">
                                <div className="flex items-center gap-3">
                                    <Mail size={16} className="text-gray-500" />
                                    <a href="mailto:emmasco2025@gmail.com" className="hover:text-white transition-colors">emmasco2025@gmail.com</a>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Globe size={16} className="text-gray-500" />
                                    <a href="https://uccai.online" target="_blank" className="hover:text-white transition-colors">uccai.online</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#212121] p-4 flex justify-end px-6">
                        <button 
                            onClick={() => setShowFounderModal(false)}
                            className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative w-full min-w-0">
        
        {/* Header / Top Bar (Non-Absolute to simplify layout or Absolute with spacer) */}
        {/* Using absolute header but ensuring scroll container has top padding or transparency is managed */}
        <div className="absolute top-0 left-0 right-0 p-3 z-20 flex justify-between items-center md:justify-start bg-[#212121]/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none pointer-events-none md:pointer-events-auto">
            <div className="md:hidden pointer-events-auto">
                 <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-gray-400 hover:text-white"
                 >
                    <PanelLeft size={24} />
                 </button>
            </div>
            <button className="pointer-events-auto flex flex-col items-center md:items-start gap-0 text-lg font-semibold text-gray-200 px-3 py-2 rounded-xl hover:bg-[#2f2f2f] transition-colors cursor-pointer ml-auto md:ml-0 mr-auto md:mr-0">
                <div className="flex items-center gap-1.5">
                    <span>UCCAI</span>
                    <span className="text-gray-500 text-lg">Flash Lite</span>
                    <ChevronDown size={16} className="text-gray-500 mt-0.5" />
                </div>
                <div className="text-[10px] text-gray-500 font-normal -mt-1">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            </button>
            <div className="w-10 md:hidden"></div> {/* spacer */}
        </div>

        {/* Scrollable Area - Use Flex-1 and min-h-0 to allow scrolling inside flex item */}
        <div className="flex-1 overflow-y-auto w-full relative min-h-0 scroll-smooth pt-16 md:pt-14">
            <AnimatePresence mode="wait">
            {messages.length === 0 ? (
                <motion.div 
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="min-h-full flex flex-col items-center justify-center p-4"
                >
                        <div className="w-16 h-16 bg-white rounded-full mb-6 flex items-center justify-center shadow-lg">
                            {/* Logo */}
                            <Sparkles size={32} className="text-black" />
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
                                    <Search size={14} />
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
                                    <MailIcon size={14} />
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
                                    <Info size={14} />
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
                                    <Code size={14} />
                                </div>
                            </div>
                        </button>
                        </div>
                </motion.div>
            ) : (
                <motion.div 
                    key="chat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full min-h-full pb-4"
                >
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}
                    <div ref={messagesEndRef} className="h-4" />
                </motion.div>
            )}
            </AnimatePresence>
        </div>

        {/* Static Input Area (Footer) - Ensures layout stability and scrolling */}
        <div className="flex-none p-4 w-full bg-[#212121] z-10">
            <div className="max-w-3xl mx-auto">
                <div className="bg-[#2f2f2f] rounded-[26px] p-3 shadow-xl relative border border-white/5 focus-within:border-white/10 transition-colors">
                    {/* Attachment Preview Area */}
                    {attachments.length > 0 && (
                        <div className="flex gap-3 mb-2 overflow-x-auto pb-2 px-2 scrollbar-thin">
                            {attachments.map((att, idx) => (
                                <div key={idx} className="relative group flex-none">
                                    <div className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden bg-[#212121] flex items-center justify-center">
                                        {att.file.type.startsWith('image/') ? (
                                            <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Paperclip size={24} className="text-gray-400" />
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => removeAttachment(idx)}
                                        className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-0.5 shadow-md hover:bg-red-500 transition-colors"
                                    >
                                        <X size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
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
                             <input 
                                type="file" 
                                multiple 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileSelect}
                                accept="image/*,application/pdf,text/*"
                             />
                             <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 hover:bg-[#424242] rounded-full transition-colors hover:text-white" 
                                title="Attach file"
                             >
                                <Paperclip size={20} />
                             </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleSend()}
                                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                                className={`p-2 rounded-full transition-all duration-200 ${
                                    (input.trim() || attachments.length > 0) && !isLoading
                                    ? "bg-white text-black hover:bg-gray-200 shadow-md"
                                    : "bg-[#676767]/30 text-gray-500 cursor-not-allowed"
                                }`}
                            >
                                <ArrowUp size={18} strokeWidth={3} />
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

const App = () => {
    return <ChatInterface />;
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);