 
import React, { useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Smile } from 'lucide-react';

interface InputBarProps {
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const InputBar: React.FC<InputBarProps> = ({ currentMessage, setCurrentMessage, onSubmit }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [currentMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as any);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMessage.trim()) {
      onSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200/50 bg-white/70 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Additional action buttons */}
        <div className="flex space-x-1 pb-2">
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
          </button>
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
            title="Voice message"
          >
            <Mic className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          </button>
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
            title="Add emoji"
          >
            <Smile className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>

        {/* Input area */}
        <div className="flex-1 relative">
          <div className="relative bg-gray-50 border-2 border-gray-200 rounded-2xl focus-within:border-blue-400 focus-within:bg-white transition-all duration-200 shadow-sm hover:shadow-md">
            <textarea
              ref={textareaRef}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              className="w-full px-4 py-3 pr-12 bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-500 text-sm leading-relaxed max-h-[120px] min-h-[48px]"
              rows={1}
            />
            
            {/* Character count (optional) */}
            {currentMessage.length > 200 && (
              <div className="absolute bottom-1 left-3 text-xs text-gray-400">
                {currentMessage.length} characters
              </div>
            )}
          </div>

          {/* Input decoration */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none opacity-0 focus-within:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!currentMessage.trim()}
          className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center min-w-[48px] min-h-[48px] ${
            currentMessage.trim()
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="Send message"
        >
          <Send className={`w-5 h-5 ${currentMessage.trim() ? 'animate-pulse' : ''}`} />
        </button>
      </form>

      {/* Quick suggestions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          "What's the weather like?",
          "Tell me a joke",
          "Help me with coding",
          "Explain quantum physics"
        ].map((suggestion, index) => (
          <button
            key={index}
            onClick={() => setCurrentMessage(suggestion)}
            className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200 hover:scale-105 transform"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Typing indicator area */}
      <div className="mt-2 h-4 flex items-center">
        <div className="flex items-center space-x-1 text-xs text-gray-400">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-200"></div>
          </div>
          <span className="opacity-0">AI is typing...</span>
        </div>
      </div>
    </div>
  );
};

export default InputBar;