"use client";

import Header from '../components/Header';
import InputBar from '../components/InputBar';
import MessageArea from '../components/MessageArea';
import React, { useState, FormEvent } from 'react';

interface SearchInfo {
  stages: string[];
  query: string;
  urls: string[];
  error?: string;
}

interface Message {
  id: number;
  content: string;
  isUser: boolean;
  type: string;
  isLoading?: boolean;
  searchInfo?: SearchInfo;
}

// Define the possible event data types
interface CheckpointEventData {
  type: 'checkpoint';
  checkpoint_id: string;
}

interface ContentEventData {
  type: 'content';
  content: string;
}

interface SearchStartEventData {
  type: 'search_start';
  query: string;
}

interface SearchResultsEventData {
  type: 'search_results';
  urls: string | string[];
}

interface SearchErrorEventData {
  type: 'search_error';
  error: string;
}

interface EndEventData {
  type: 'end';
}

type EventData = CheckpointEventData | ContentEventData | SearchStartEventData | SearchResultsEventData | SearchErrorEventData | EndEventData;

const Home: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hi there! I'm your AI assistant. How can I help you today?",
      isUser: false,
      type: 'message',
    },
  ]);

  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [checkpointId, setCheckpointId] = useState<string | null>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (currentMessage.trim()) {
      const newMessageId = messages.length > 0 ? Math.max(...messages.map(msg => msg.id)) + 1 : 1;

      setMessages(prev => [
        ...prev,
        {
          id: newMessageId,
          content: currentMessage,
          isUser: true,
          type: 'message',
        },
      ]);

      const userInput = currentMessage;
      setCurrentMessage("");

      try {
        const aiResponseId = newMessageId + 1;

        setMessages(prev => [
          ...prev,
          {
            id: aiResponseId,
            content: "",
            isUser: false,
            type: 'message',
            isLoading: true,
            searchInfo: {
              stages: [],
              query: "",
              urls: [],
            },
          },
        ]);

        let url = `https://perception-latest.onrender.com/chat_stream/${encodeURIComponent(userInput)}`;
        if (checkpointId) {
          url += `?checkpoint_id=${encodeURIComponent(checkpointId)}`;
        }

        const eventSource = new EventSource(url);
        let streamedContent = "";
        let searchData: SearchInfo | null = null;

        eventSource.onmessage = (event: MessageEvent) => {
          try {
            console.log('Raw event data:', event.data);

            // Try to sanitize the JSON string before parsing
            let sanitizedData = event.data;

          
            sanitizedData = sanitizedData
              .replace(/\\/g, '\\\\') // Fix single backslashes
              .replace(/\n/g, '\\n')   // Fix unescaped newlines
              .replace(/\r/g, '\\r')   // Fix unescaped carriage returns
              .replace(/\t/g, '\\t');  // Fix unescaped tabs

            const data = JSON.parse(sanitizedData) as EventData;

            if (data.type === 'checkpoint') {
              setCheckpointId(data.checkpoint_id);
            } else if (data.type === 'content') {
              streamedContent += data.content;

              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiResponseId
                    ? { ...msg, content: streamedContent, isLoading: false }
                    : msg
                )
              );
            } else if (data.type === 'search_start') {
              const newSearchInfo: SearchInfo = {
                stages: ['searching'],
                query: data.query,
                urls: [],
              };
              searchData = newSearchInfo;

              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiResponseId
                    ? { ...msg, content: streamedContent, searchInfo: newSearchInfo, isLoading: false }
                    : msg
                )
              );
            } else if (data.type === 'search_results') {
              try {
                const urls: string[] = typeof data.urls === 'string' ? JSON.parse(data.urls) : data.urls;

                const newSearchInfo: SearchInfo = {
                  stages: searchData ? [...searchData.stages, 'reading'] : ['reading'],
                  query: searchData?.query || "",
                  urls,
                };
                searchData = newSearchInfo;

                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiResponseId
                      ? { ...msg, content: streamedContent, searchInfo: newSearchInfo, isLoading: false }
                      : msg
                  )
                );
              } catch (err) {
                console.error("Error parsing search results:", err);
              }
            } else if (data.type === 'search_error') {
              const newSearchInfo: SearchInfo = {
                stages: searchData ? [...searchData.stages, 'error'] : ['error'],
                query: searchData?.query || "",
                error: data.error,
                urls: [],
              };
              searchData = newSearchInfo;

              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiResponseId
                    ? { ...msg, content: streamedContent, searchInfo: newSearchInfo, isLoading: false }
                    : msg
                )
              );
            } else if (data.type === 'end') {
              if (searchData) {
                const finalSearchInfo: SearchInfo = {
                  ...searchData,
                  stages: [...searchData.stages, 'writing'],
                };

                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiResponseId
                      ? { ...msg, searchInfo: finalSearchInfo, isLoading: false }
                      : msg
                  )
                );
              }

              eventSource.close();
            }
          } catch (error) {
            console.error("Error parsing event data:", error, event.data);
          }
        };

        eventSource.onerror = (error: Event) => {
          console.error("EventSource error:", error);
          eventSource.close();

          if (!streamedContent) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === aiResponseId
                  ? { ...msg, content: "Sorry, there was an error processing your request.", isLoading: false }
                  : msg
              )
            );
          }
        };

        eventSource.addEventListener('end', () => {
          eventSource.close();
        });
      } catch (error) {
        console.error("Error setting up EventSource:", error);
        setMessages(prev => [
          ...prev,
          {
            id: newMessageId + 1,
            content: "Sorry, there was an error connecting to the server.",
            isUser: false,
            type: 'message',
            isLoading: false,
          },
        ]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Chat UI */}
      <div className="relative w-full max-w-7xl h-[85vh] bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col h-full">
          <Header />
          <MessageArea messages={messages} />
          <InputBar
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;