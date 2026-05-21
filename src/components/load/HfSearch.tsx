import { useEffect, useRef, useState } from "react";
import { Check, Clipboard, Search } from "lucide-react";
import { getHfRepoFiles, HfModel, searchHf } from "../../lib/tauri";

function fileToPattern(filename: string): string {
  const shardMatch = filename.match(/^(.*)-\d{5}-of-\d{5}\.gguf$/i);
  if (shardMatch) return `*${shardMatch[1]}*`;
  return filename;
}

// Repos often end in "-GGUF" but filenames drop that suffix.
function modelNameFromRepo(repoId: string): string {
  const base = repoId.split("/").pop() ?? repoId;
  return base.replace(/-GGUF$/i, "");
}

function stripModelName(filename: string, modelName: string): string {
  const prefix = modelName + "-";
  if (filename.toLowerCase().startsWith(prefix.toLowerCase())) {
    return filename.slice(prefix.length);
  }
  return filename;
}

function RadioRow({
  label,
  selected,
  onClick,
  italic,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  italic?: boolean;
}) {
  return (
    <li
      onClick={onClick}
      className={`flex items-center gap-3 border rounded px-3 py-2 cursor-pointer select-none ${
        selected
          ? "bg-indigo-900/40 border-indigo-500"
          : "bg-slate-800 border-slate-700 hover:bg-slate-700"
      }`}
    >
      <div
        className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center ${
          selected ? "bg-indigo-500 border-indigo-500" : "border-slate-600"
        }`}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
      <span className={`text-sm truncate ${italic ? "text-slate-400 italic" : "text-slate-200"}`}>
        {label}
      </span>
    </li>
  );
}

export default function HfSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HfModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  // step: "model" = picking primary file, "extra" = picking companion file
  const [step, setStep] = useState<"model" | "extra">("model");
  const [primaryFile, setPrimaryFile] = useState<string | null>(null);
  const [extraFile, setExtraFile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        setResults(await searchHf(query));
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  async function selectRepo(repoId: string) {
    setSelectedRepo(repoId);
    setFiles([]);
    setPrimaryFile(null);
    setExtraFile(null);
    setStep("model");
    setError(null);
    try {
      setFiles(await getHfRepoFiles(repoId));
    } catch (e) {
      setError(String(e));
    }
  }

  function buildCommand(): string {
    if (!selectedRepo || !primaryFile) return "";
    let cmd =
      `hf download ${selectedRepo} \\\n` +
      `    --local-dir ~/llms/${selectedRepo} \\\n` +
      `    --include "${fileToPattern(primaryFile)}"`;
    if (extraFile) {
      cmd += ` \\\n    --include "${fileToPattern(extraFile)}"`;
    }
    return cmd;
  }

  async function copyCommand() {
    await navigator.clipboard.writeText(buildCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function goBack() {
    if (step === "extra") {
      setStep("model");
      setExtraFile(null);
    } else {
      setSelectedRepo(null);
      setFiles([]);
      setPrimaryFile(null);
      setExtraFile(null);
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden gap-3">
      <div className="relative shrink-0">
        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search HuggingFace (e.g. llama-3.2)"
          className="w-full pl-9 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}
      {loading && <p className="text-slate-500 text-xs">Searching…</p>}

      {results.length > 0 && !selectedRepo && (
        <ul className="flex-1 overflow-y-auto space-y-1">
          {results.map((m) => (
            <li key={m.modelId}>
              <button
                onClick={() => selectRepo(m.modelId)}
                className="w-full text-left px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 border border-slate-700"
              >
                <span className="font-medium">{m.modelId}</span>
                {m.downloads != null && (
                  <span className="ml-2 text-xs text-slate-500">
                    ↓ {m.downloads.toLocaleString()}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedRepo && (
        <div className="flex flex-col flex-1 overflow-hidden gap-2">
          <div className="flex items-center gap-2">
            <button onClick={goBack} className="text-xs text-indigo-400 hover:underline">
              ← back
            </button>
            <span className="text-xs text-slate-400 truncate">{selectedRepo}</span>
            <span className="ml-auto text-xs font-medium text-slate-500 shrink-0">
              {step === "model" ? "1. model file" : "2. extra file"}
            </span>
          </div>

          {files.length === 0 && <p className="text-slate-500 text-xs">Loading files…</p>}

          <ul className="flex-1 overflow-y-auto space-y-1">
            {step === "extra" && (
              <RadioRow
                label="No extra file"
                selected={extraFile === null}
                onClick={() => setExtraFile(null)}
                italic
              />
            )}
            {(() => {
              const modelName = modelNameFromRepo(selectedRepo!);
              const hasName = (f: string) => f.toLowerCase().includes(modelName.toLowerCase());
              const visibleFiles = step === "model"
                ? files.filter(hasName)
                : files.filter((f) => !hasName(f));
              return visibleFiles.map((f) => (
                <RadioRow
                  key={f}
                  label={step === "model" ? stripModelName(f, modelName) : f}
                  selected={step === "model" ? primaryFile === f : extraFile === f}
                  onClick={() => {
                    if (step === "model") {
                      setPrimaryFile(f);
                      setExtraFile(null);
                      setStep("extra");
                    } else {
                      setExtraFile(f);
                    }
                  }}
                />
              ));
            })()}
          </ul>

          {step === "extra" && (
            <button
              onClick={copyCommand}
              className="shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-sm text-white"
            >
              {copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy hf command"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
