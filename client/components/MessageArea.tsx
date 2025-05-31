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

// Utility function to clean content for copying
const cleanContentForCopy = (content: string): string => {
  return content
    // Remove HTML tags completely
    .replace(/<[^>]*>/g, '')
    // Replace HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Convert \n literals to actual line breaks
    .replace(/\\n/g, '\n')
    // Clean up multiple consecutive line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Remove leading/trailing whitespace but preserve internal formatting
    .trim();
};

// Utility function to format content for display (preserves original formatting)
const formatContentForDisplay = (content: string): string => {
  // For display, we want to preserve the original content structure
  // but convert escape sequences to actual formatting
  return content
    .replace(/\\n/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

// Utility function to render content with proper line breaks
const renderFormattedContent = (content: string) => {
  const displayContent = formatContentForDisplay(content);

  // Split content by line breaks and render each line
  const lines = displayContent.split('\n');

  return lines.map((line, index) => (
    <React.Fragment key={index}>
      {index > 0 && <br />}
      {line || '\u00A0'} {/* Non-breaking space for empty lines */}
    </React.Fragment>
  ));
};

const MessageArea: React.FC<MessageAreaProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopyMessage = (content: string, buttonElement: HTMLElement) => {
    const textToCopy = cleanContentForCopy(content);

    navigator.clipboard.writeText(textToCopy).then(() => {
      // Visual feedback
      const originalContent = buttonElement.innerHTML;
      buttonElement.innerHTML = `
        <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      `;
      setTimeout(() => {
        buttonElement.innerHTML = originalContent;
      }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-purple-100/20"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-cyan-100/20"></div>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-gradient-to-br from-blue-400/5 to-purple-600/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/3 -right-8 w-96 h-96 bg-gradient-to-br from-emerald-400/5 to-blue-600/5 rounded-full blur-3xl animate-float-delay"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gradient-to-br from-pink-400/5 to-orange-600/5 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Messages container */}
      <div className="relative flex-1 h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 animate-bounce-subtle">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full animate-ping"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Ready to help you!
                </h3>
                <p className="text-gray-600 max-w-md">
                  Start a conversation by asking me anything. I can help with coding, writing, analysis, and much more.
                </p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={message.id} className="animate-fade-in-up">
              {message.searchInfo && (
                <div className="mb-4 transform transition-all duration-300 hover:scale-[1.01]">
                  <SearchProgress searchInfo={message.searchInfo} />
                </div>
              )}

              <div className="group relative">
                {/* Enhanced MessageBubble with proper content formatting */}
                <div className={`max-w-4xl mx-auto ${message.isUser ? 'flex justify-end' : 'flex justify-start'}`}>
                  <div className={`
                    relative max-w-[85%] rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm border
                    ${message.isUser
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-500/20'
                      : 'bg-white/90 text-gray-800 border-gray-200/50'
                    }
                    transform transition-all duration-200 hover:shadow-xl hover:scale-[1.02]
                  `}>
                    {/* Content with proper formatting */}
                    <div className={`
                      prose prose-sm max-w-none leading-relaxed
                      ${message.isUser ? 'prose-invert' : ''}
                    `}>
                      {message.type === 'code' ? (
                        <pre className={`
                          p-4 rounded-lg overflow-x-auto text-sm font-mono
                          ${message.isUser ? 'bg-black/20' : 'bg-gray-100'}
                        `}>
                          <code>{formatContentForDisplay(message.content)}</code>
                        </pre>
                      ) : (
                        <div className="whitespace-pre-wrap break-words">
                          {renderFormattedContent(message.content)}
                        </div>
                      )}
                    </div>

                    {/* Loading indicator */}
                    {message.isLoading && (
                      <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-current/10">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm opacity-70">Thinking...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced copy functionality */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                  <button
                    onClick={(e) => handleCopyMessage(message.content, e.currentTarget)}
                    className="flex items-center justify-center w-8 h-8 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
                    title="Copy message"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Enhanced styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(248, 250, 252, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(148, 163, 184, 0.6), rgba(100, 116, 139, 0.6));
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(148, 163, 184, 0.8), rgba(100, 116, 139, 0.8));
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(1deg);
          }
          66% {
            transform: translateY(-10px) rotate(-1deg);
          }
        }

        @keyframes float-delay {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-15px) rotate(-1deg);
          }
          66% {
            transform: translateY(-25px) rotate(1deg);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.2;
            transform: scale(1.05);
          }
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0) rotate(3deg);
          }
          50% {
            transform: translateY(-10px) rotate(3deg);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-float-delay {
          animation: float-delay 10s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }

        /* Enhanced focus styles for accessibility */
        button:focus-visible {
          outline: 2px solid rgb(59, 130, 246);
          outline-offset: 2px;
        }

        /* Smooth transitions for all interactive elements */
        * {
          transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }

        /* Ensure proper text rendering */
        .whitespace-pre-wrap {
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        /* Code block styling */
        pre {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
      `}</style>
    </div>
  );
};

export default MessageArea;