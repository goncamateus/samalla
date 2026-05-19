import { useEffect, useState } from "react";
import { FolderOpen, RefreshCw } from "lucide-react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { listLocalModels } from "../../lib/tauri";
import { useApp } from "../../contexts/AppContext";
import HfSearch from "./HfSearch";

type SubTab = "local" | "hf";

interface ModelPickerProps {
  hideDirectory?: boolean;
}

export default function ModelPicker({ hideDirectory = false }: ModelPickerProps) {
  const { state, dispatch } = useApp();
  const [subTab, setSubTab] = useState<SubTab>("local");
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function pickFolder() {
    const selected = await openDialog({ directory: true, multiple: false });
    if (typeof selected === "string") {
      dispatch({ type: "PATCH_CONFIG", payload: { models_dir: selected } });
    }
  }

  async function refreshLocal() {
    if (!state.config.models_dir) return;
    setLoading(true);
    try {
      const list = await listLocalModels(state.config.models_dir);
      setModels(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (subTab === "local") refreshLocal();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab, state.config.models_dir]);

  return (
    <div className={hideDirectory ? "flex flex-col flex-1 overflow-hidden space-y-3" : "space-y-3"}>
      {/* Models directory */}
      {!hideDirectory && (
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Models directory
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={state.config.models_dir}
              onChange={(e) =>
                dispatch({ type: "PATCH_CONFIG", payload: { models_dir: e.target.value } })
              }
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="/home/user/models"
            />
            <button
              onClick={pickFolder}
              title="Browse for folder"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300 hover:bg-slate-700 hover:border-slate-500 transition-colors shrink-0"
            >
              <FolderOpen className="w-4 h-4 text-indigo-400" />
              Browse
            </button>
          </div>
        </div>
      )}

      {/* Currently selected model */}
      {state.config.last_model && (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded px-3 py-2">
          <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{state.config.last_model}</span>
        </div>
      )}

      {/* Sub-tab selector */}
      <div className="flex border-b border-slate-700">
        {(["local", "hf"] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${
              subTab === t
                ? "border-b-2 border-indigo-500 text-indigo-400"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t === "local" ? "Local" : "HuggingFace"}
          </button>
        ))}
      </div>

      {subTab === "local" && (
        <div className={hideDirectory ? "flex flex-col flex-1 overflow-hidden" : ""}>
          <div className="flex justify-end mb-2">
            <button
              onClick={refreshLocal}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
          {models.length === 0 ? (
            <p className="text-slate-500 text-xs">
              No .gguf files found in {state.config.models_dir || "the configured directory"}.
            </p>
          ) : (
            <ul className={hideDirectory ? "flex-1 overflow-y-auto space-y-1" : "max-h-48 overflow-y-auto space-y-1"}>
              {models.map((m) => (
                <li key={m}>
                  <button
                    onClick={() =>
                      dispatch({ type: "PATCH_CONFIG", payload: { last_model: m } })
                    }
                    className={`w-full text-left px-3 py-2 rounded text-xs truncate border transition-colors ${
                      state.config.last_model === m
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {m.split("/").pop()}
                    <span className="ml-1 text-slate-500 font-normal">
                      {m.replace(/\/[^/]+$/, "")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {subTab === "hf" && <HfSearch />}
    </div>
  );
}
