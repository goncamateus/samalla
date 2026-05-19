import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "../../lib/api";

interface Props {
  messages: Message[];
  streaming: boolean;
}

export default function ChatWindow({ messages, streaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.length === 0 && (
        <p className="text-center text-slate-600 text-sm mt-8">
          Send a message to test the loaded model.
        </p>
      )}
      {messages.map((m, i) => (
        <div
          key={i}
          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
              m.role === "user"
                ? "bg-indigo-600 text-white whitespace-pre-wrap"
                : "bg-slate-800 text-slate-100 border border-slate-700"
            }`}
          >
            {m.role === "user" ? (
              m.content
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ className, children }) =>
                    className ? (
                      <code className="text-xs font-mono text-slate-300">{children}</code>
                    ) : (
                      <code className="bg-slate-700 text-indigo-300 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                    ),
                  pre: ({ children }) => <pre className="bg-slate-950 border border-slate-700 rounded p-3 overflow-x-auto mb-2">{children}</pre>,
                  h1: ({ children }) => <h1 className="font-bold mb-1 mt-2 text-slate-100 text-base">{children}</h1>,
                  h2: ({ children }) => <h2 className="font-bold mb-1 mt-2 text-slate-100 text-sm">{children}</h2>,
                  h3: ({ children }) => <h3 className="font-bold mb-1 mt-2 text-slate-100 text-sm">{children}</h3>,
                  blockquote: ({ children }) => <blockquote className="border-l-2 border-slate-600 pl-3 italic text-slate-400 mb-2">{children}</blockquote>,
                  a: ({ href, children }) => <a href={href} className="text-indigo-400 underline">{children}</a>,
                  hr: () => <hr className="border-slate-700 my-2" />,
                  table: ({ children }) => <table className="text-xs border-collapse mb-2 w-full">{children}</table>,
                  th: ({ children }) => <th className="border border-slate-600 px-2 py-1 bg-slate-700 text-left">{children}</th>,
                  td: ({ children }) => <td className="border border-slate-600 px-2 py-1">{children}</td>,
                }}
              >
                {m.content}
              </ReactMarkdown>
            )}
            {streaming && i === messages.length - 1 && m.role === "assistant" && (
              <span className="inline-block w-1.5 h-4 bg-slate-400 ml-0.5 animate-pulse align-text-bottom" />
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
