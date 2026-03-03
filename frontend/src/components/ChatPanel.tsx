import { useState, useEffect, useRef } from "react";
import { chat as chatApi } from "../api";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPanel({
  accountId,
  accountName,
}: {
  accountId?: number;
  accountName?: string;
}) {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingStartTime] = useState<Date>(new Date());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const ensureConversation = async (): Promise<number> => {
    if (conversationId) return conversationId;
    const title = accountName ? `Chat: ${accountName}` : "New Conversation";
    const conv = await chatApi.createConversation(accountId, title);
    setConversationId(conv.id);
    return conv.id;
  };

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);
    setStreaming(true);
    setStreamingContent("");

    try {
      const convId = await ensureConversation();
      const response = await chatApi.sendMessage(convId, userMessage);

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulated += data.content;
                setStreamingContent(accumulated);
              }
              if (data.done) {
                // Stream complete
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: accumulated, timestamp: new Date() }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Failed to get response"}`, timestamp: new Date() },
      ]);
    } finally {
      setStreaming(false);
      setStreamingContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasContent = input.trim().length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-6 space-y-5 scroll-smooth">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            {/* Purple chat icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#ECE1F0] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#802DC8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-[#001C3D] font-[Space_Grotesk]">Start a conversation</p>
            <p className="text-sm text-gray-400 mt-1 text-center max-w-sm">
              {accountName
                ? `Ask about strategy for ${accountName}, generate plans, or get coaching`
                : "Ask about BSS Magic sales methodology or get strategic advice"}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
          >
            {msg.role === "user" ? (
              <div className="max-w-[75%] ml-auto">
                <p className="text-xs text-gray-400 text-right mb-1">You</p>
                <div className="bg-[#802DC8] text-white rounded-2xl rounded-br-md px-4 py-3 text-sm">
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <p className="text-[10px] text-gray-400 text-right mt-1">{formatTime(msg.timestamp)}</p>
              </div>
            ) : (
              <div className="flex gap-2.5 max-w-[75%]">
                {/* AI Avatar */}
                <div className="w-7 h-7 bg-[#802DC8] rounded-full flex items-center justify-center flex-shrink-0 mt-6">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">AI Assistant</p>
                  <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3 text-sm text-gray-900">
                    <div className="prose-ai max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Streaming content */}
        {streaming && streamingContent && (
          <div className="flex justify-start animate-slide-up">
            <div className="flex gap-2.5 max-w-[75%]">
              {/* AI Avatar */}
              <div className="w-7 h-7 bg-[#802DC8] rounded-full flex items-center justify-center flex-shrink-0 mt-6">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">AI Assistant</p>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3 text-sm text-gray-900">
                  <div className="prose-ai streaming-cursor max-w-none">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{formatTime(streamingStartTime)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Thinking state */}
        {streaming && !streamingContent && (
          <div className="flex justify-start animate-slide-up">
            <div className="flex gap-2.5">
              {/* AI Avatar */}
              <div className="w-7 h-7 bg-[#802DC8] rounded-full flex items-center justify-center flex-shrink-0 mt-6">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">AI Assistant</p>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-4 bg-gray-50/50">
        <div className="flex items-end gap-3 rounded-xl border-2 border-gray-200 focus-within:border-[#802DC8] transition-colors bg-white shadow-sm px-4 py-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              accountName
                ? `Ask about ${accountName}...`
                : "Ask anything about sales strategy..."
            }
            rows={2}
            className="flex-1 resize-none outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-transparent py-1"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              hasContent && !streaming
                ? "bg-[#802DC8] text-white hover:bg-[#6b24a8]"
                : "bg-gray-300 text-white cursor-not-allowed"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
