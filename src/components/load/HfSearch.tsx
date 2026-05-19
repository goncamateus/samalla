import { useEffect, useRef, useState } from "react";
import { Download, Search } from "lucide-react";
import {
  downloadHfModel,
  getHfRepoFiles,
  HfModel,
  onDownloadProgress,
  searchHf,
} from "../../lib/tauri";
import { useApp } from "../../contexts/AppContext";

export default function HfSearch() {
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HfModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [dlPct, setDlPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await searchHf(query);
        setResults(r);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function selectRepo(repoId: string) {
    setSelectedRepo(repoId);
    setFiles([]);
    setError(null);
    try {
      const f = await getHfRepoFiles(repoId);
      setFiles(f);
    } catch (e) {
      setError(String(e));
    }
  }

  async function startDownload(filename: string) {
    if (!selectedRepo || downloading) return;
    setDownloading(filename);
    setDlPct(0);
    setError(null);
    const unlisten = await onDownloadProgress((p) => {
      setDlPct(p.pct ?? null);
    });
    try {
      const dest = await downloadHfModel(
        selectedRepo,
        filename,
        state.config.models_dir
      );
      dispatch({ type: "PATCH_CONFIG", payload: { last_model: dest } });
    } catch (e) {
      setError(String(e));
    } finally {
      unlisten();
      setDownloading(null);
      setDlPct(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search HuggingFace (e.g. llama-3.2)"
          className="w-full pl-9 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      {loading && (
        <p className="text-slate-500 text-xs">Searching…</p>
      )}

      {results.length > 0 && !selectedRepo && (
        <ul className="max-h-48 overflow-y-auto space-y-1">
          {results.map((m) => (
            <li key={m.model_id}>
              <button
                onClick={() => selectRepo(m.model_id)}
                className="w-full text-left px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 border border-slate-700"
              >
                <span className="font-medium">{m.model_id}</span>
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
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => { setSelectedRepo(null); setFiles([]); }}
              className="text-xs text-indigo-400 hover:underline"
            >
              ← back
            </button>
            <span className="text-xs text-slate-400">{selectedRepo}</span>
          </div>
          {files.length === 0 && (
            <p className="text-slate-500 text-xs">Loading files…</p>
          )}
          <ul className="space-y-1">
            {files.map((f) => (
              <li key={f} className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded px-3 py-2">
                <span className="text-sm text-slate-200 truncate flex-1">{f}</span>
                {downloading === f ? (
                  <div className="flex items-center gap-2 ml-3">
                    <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all"
                        style={{ width: `${dlPct ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">
                      {dlPct != null ? `${dlPct.toFixed(0)}%` : "…"}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => startDownload(f)}
                    disabled={!!downloading}
                    className="ml-3 p-1 rounded hover:bg-slate-600 text-indigo-400 disabled:opacity-40"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
