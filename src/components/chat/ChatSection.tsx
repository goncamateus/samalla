import { useState } from "react";
import { Message, streamChat } from "../../lib/api";
import { useApp } from "../../contexts/AppContext";
import ChatInput from "./ChatInput";
import ChatWindow from "./ChatWindow";

export default function ChatSection() {
  const { state } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRunning = state.serverStatus === "ready" || state.serverStatus === "reasoning";

  async function handleSend(text: string) {
    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setError(null);
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...next, assistantMsg]);

    try {
      const gen = streamChat(state.config.server_port, next);
      for await (const token of gen) {
        assistantMsg.content += token;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { ...assistantMsg };
          return copy;
        });
      }
    } catch (e) {
      setError(String(e));
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="mx-4 mt-3 bg-red-900/30 border border-red-700 rounded px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}
      <ChatWindow messages={messages} streaming={streaming} />
      {messages.length > 0 && (
        <div className="px-4 pb-1">
          <button
            onClick={() => setMessages([])}
            className="text-xs text-slate-600 hover:text-slate-400"
          >
            Clear chat
          </button>
        </div>
      )}
      <ChatInput disabled={!isRunning || streaming} onSend={handleSend} />
    </div>
  );
}
