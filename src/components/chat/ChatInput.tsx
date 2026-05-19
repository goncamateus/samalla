import { useRef, useState } from "react";
import { Send } from "lucide-react";

interface Props {
  disabled: boolean;
  onSend: (text: string) => void;
}

export default function ChatInput({ disabled, onSend }: Props) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    ref.current?.focus();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-slate-700 p-3 flex gap-2">
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        disabled={disabled}
        rows={2}
        placeholder={disabled ? "Start the server first…" : "Type a message (Enter to send)"}
        className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 resize-none focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        onClick={submit}
        disabled={disabled || !text.trim()}
        className="self-end p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
