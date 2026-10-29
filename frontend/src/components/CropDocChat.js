import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { apiClient } from '../utils/api';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hello! I am Crop Doc, your digital agricultural specialist. Scan a leaf using the camera on the left, or ask me any questions about crop diseases, fertilizers, or soil care, and I will give you simple, actionable advice."
};

const CropDocChat = () => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/chat', {
        message: userMessage.content,
        session_id: sessionId
      });

      setSessionId(response.data.session_id);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I couldn't process your message right now. Please try again in a moment."
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessage = (content) => {
    // Split by newlines and render each line
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Handle bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return (
          <li key={index} className="ml-4 list-disc">
            {line.replace(/^[\s•\-\*]+/, '').trim()}
          </li>
        );
      }
      // Handle numbered lists
      if (/^\d+[\.\)]\s/.test(line.trim())) {
        return (
          <li key={index} className="ml-4 list-decimal">
            {line.replace(/^\d+[\.\)]\s*/, '').trim()}
          </li>
        );
      }
      // Regular paragraph
      if (line.trim()) {
        return <p key={index} className="mb-2">{line}</p>;
      }
      return null;
    });
  };

  return (
    <div 
      className="flex flex-col h-full bg-white rounded-3xl shadow-lg border border-[#A3B18A]/30 overflow-hidden"
      data-testid="crop-doc-chat"
    >
      {/* Header */}
      <div className="bg-[#344E41] text-white px-4 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h2 
              className="text-lg font-bold"
              style={{ fontFamily: 'Playfair Display, serif' }}
              data-testid="crop-doc-title"
            >
              Crop Doc
            </h2>
            <p className="text-white/80 text-xs">Expert Farmer Assistant</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F9F9F7]"
        data-testid="chat-messages"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            data-testid={`chat-message-${index}`}
          >
            {/* Avatar */}
            <div 
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-[#588157]' 
                  : 'bg-[#344E41]'
              }`}
            >
              {message.role === 'user' ? (
                <User className="text-white" size={16} />
              ) : (
                <Bot className="text-white" size={16} />
              )}
            </div>
            
            {/* Message Bubble */}
            <div 
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-[#588157] text-white rounded-tr-sm'
                  : 'bg-white text-[#344E41] border border-[#A3B18A]/20 rounded-tl-sm shadow-sm'
              }`}
            >
              <div className="text-sm leading-relaxed">
{formatMessage(
  message.role === 'assistant'
    ? message.content.replace(/[#*]/g, '')
    : message.content
)}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3" data-testid="chat-loading">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#344E41] flex items-center justify-center">
              <Bot className="text-white" size={16} />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-[#A3B18A]/20 shadow-sm">
              <div className="flex items-center gap-2 text-[#588157]">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">Crop Doc is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-[#A3B18A]/20 flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about crops, diseases, or farming..."
            className="flex-1 px-4 py-3 rounded-full border border-[#A3B18A]/30 focus:outline-none focus:border-[#588157] focus:ring-2 focus:ring-[#588157]/20 text-sm text-[#344E41] placeholder:text-[#A3B18A]"
            disabled={isLoading}
            data-testid="chat-input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 bg-[#344E41] text-white rounded-full flex items-center justify-center hover:bg-[#588157] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            aria-label="Send message"
            data-testid="chat-send-button"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-[#A3B18A] text-center mt-2">
          Crop Doc specializes in agricultural troubleshooting
        </p>
      </div>
    </div>
  );
};

export default CropDocChat;
