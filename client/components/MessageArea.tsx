import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import SearchProgress from './SearchProgress';

export interface SearchInfo {
  stages: string[];
  query: string;
  urls: string[];
  error?: string;
}

export interface Message {
  id: number;
  content: string;
  isUser: boolean;
  type: string;
  isLoading?: boolean;
  searchInfo?: SearchInfo;
}

interface MessageAreaProps {
  messages: Message[];
}

const MessageArea: React.FC<MessageAreaProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-gray-50/20 custom-scrollbar">
      {/* Custom scrollbar styling */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes float-delay {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delay {
          animation: float-delay 8s ease-in-out infinite;
        }
      `}</style>

      {messages.map((message, index) => (
        <div key={message.id} className="animate-fade-in">
          {message.searchInfo && (
            <div className="mb-4">
              <SearchProgress searchInfo={message.searchInfo} />
            </div>
          )}

          <MessageBubble
            message={message}
            isLast={index === messages.length - 1}
          />
        </div>
      ))}

      <div ref={messagesEndRef} />

      {/* Visual floating effects */}
      <div className="fixed top-1/2 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-2xl animate-float pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-blue-600/10 rounded-full blur-2xl animate-float-delay pointer-events-none" />
    </div>
  );
};

export default MessageArea;
