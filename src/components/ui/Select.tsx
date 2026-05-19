import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  className?: string;
}

export default function Select({ value, options, onChange, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between gap-2 min-w-[7rem] bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 hover:border-slate-500 focus:outline-none focus:border-indigo-500"
      >
        <span>{value}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 min-w-full bg-slate-800 border border-slate-700 rounded shadow-lg overflow-hidden">
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                  opt === value
                    ? "bg-indigo-600 text-white"
                    : "text-slate-200 hover:bg-slate-700"
                }`}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
