import "./App.css";

import { AppProvider, useApp } from "./contexts/AppContext";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, Terminal } from "lucide-react";
import ChatSection from "./components/chat/ChatSection";
import LaunchPanel from "./components/load/LaunchPanel";
import ModelPicker from "./components/load/ModelPicker";
import ServerConfigForm from "./components/load/ServerConfigForm";
import StatsPanel from "./components/stats/StatsPanel";

type Tab = "load" | "chat" | "stats";

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: "load", label: "1. Load" },
  { id: "chat", label: "2. Chat" },
  { id: "stats", label: "3. Stats" },
];

function Shell() {
  const { state, dispatch } = useApp();
  const { activeTab } = state;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-700 shrink-0">
        <span className="font-bold text-indigo-400 tracking-wide text-sm">
          samalla
        </span>
        <nav className="flex gap-1">
          {TAB_LABELS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => dispatch({ type: "SET_TAB", payload: id })}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="w-24" />
      </header>

      {/* Content — all sections stay mounted; only the active one is visible */}
      <main className="flex-1 overflow-hidden">
        <div className={`h-full flex overflow-hidden ${activeTab !== "load" ? "hidden" : ""}`}>

          {/* Col 1 — Paths + Model picker */}
          <div className="w-1/2 shrink-0 border-r border-slate-700 p-3 flex flex-col gap-3 overflow-hidden">
            <div className="flex gap-3 shrink-0">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">Models directory</label>
                <input
                  type="text"
                  value={state.config.models_dir}
                  onChange={(e) => dispatch({ type: "PATCH_CONFIG", payload: { models_dir: e.target.value } })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 mb-1"
                  placeholder="/home/user/models"
                />
                <button
                  onClick={async () => {
                    const sel = await open({ directory: true, multiple: false });
                    if (typeof sel === "string") dispatch({ type: "PATCH_CONFIG", payload: { models_dir: sel } });
                  }}
                  className="flex items-center gap-1.5 w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-400" /> Browse
                </button>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">llama-server</label>
                <input
                  type="text"
                  value={state.config.llama_server_path}
                  onChange={(e) => dispatch({ type: "PATCH_CONFIG", payload: { llama_server_path: e.target.value } })}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 mb-1"
                  placeholder="llama-server"
                />
                <button
                  onClick={async () => {
                    const sel = await open({ directory: false, multiple: false });
                    if (typeof sel === "string") dispatch({ type: "PATCH_CONFIG", payload: { llama_server_path: sel } });
                  }}
                  className="flex items-center gap-1.5 w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Browse
                </button>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-3 flex-1 overflow-hidden flex flex-col">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 shrink-0">Model</p>
              <ModelPicker hideDirectory />
            </div>
          </div>

          {/* Col 2 — Params + Launch */}
          <div className="w-1/2 overflow-y-auto p-3 flex flex-col gap-4">
            <ServerConfigForm />
            <div className="border-t border-slate-700 pt-3">
              <LaunchPanel />
            </div>
          </div>

        </div>

        <div className={`h-full ${activeTab !== "chat" ? "hidden" : ""}`}>
          <ChatSection />
        </div>

        <div className={`h-full ${activeTab !== "stats" ? "hidden" : ""}`}>
          <StatsPanel />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
