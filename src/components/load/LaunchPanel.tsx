import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Play, Square } from "lucide-react";
import { getServerLog, getServerStatus, launchServer, stopServer } from "../../lib/tauri";
import { ServerStatus, useApp } from "../../contexts/AppContext";

async function queryDetailedStatus(port: number): Promise<ServerStatus> {
  try {
    const resp = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1000) });
    if (resp.status === 503) return "loading";
    if (!resp.ok) return "error";
    // Server is ready — check if any slot is actively generating
    try {
      const slotsResp = await fetch(`http://127.0.0.1:${port}/slots`, { signal: AbortSignal.timeout(1000) });
      if (slotsResp.ok) {
        const slots: { state: number }[] = await slotsResp.json();
        if (slots.some((s) => s.state === 1)) return "reasoning";
      }
    } catch { /* /slots unavailable — that's fine */ }
    return "ready";
  } catch {
    // Connection refused or timeout: process started but server not yet listening
    return "loading";
  }
}

export default function LaunchPanel() {
  const { state, dispatch } = useApp();
  const { config, serverStatus } = state;
  const [log, setLog] = useState<string[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // No polling needed when already stopped or errored
    if (serverStatus === "stopped" || serverStatus === "error") return;

    // Fast poll while loading to catch ready transition; slow heartbeat once ready
    const interval = serverStatus === "loading" ? 1500 : 20000;

    pollRef.current = setInterval(async () => {
      const procStatus = await getServerStatus();
      if (procStatus === "stopped") {
        dispatch({ type: "SET_SERVER_STATUS", payload: "stopped" });
        return;
      }
      const detailed = await queryDetailedStatus(config.server_port);
      dispatch({ type: "SET_SERVER_STATUS", payload: detailed });
      if (logOpen) {
        const lines = await getServerLog();
        setLog(lines);
      }
    }, interval);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [serverStatus, dispatch, logOpen, config.server_port]);

  useEffect(() => {
    if (logOpen && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log, logOpen]);

  async function handleLaunch() {
    dispatch({ type: "SET_ERROR", payload: null });
    dispatch({ type: "SET_SERVER_STATUS", payload: "loading" });
    try {
      await launchServer(config);
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: String(e) });
      dispatch({ type: "SET_SERVER_STATUS", payload: "error" });
    }
  }

  async function handleStop() {
    try {
      await stopServer();
      dispatch({ type: "SET_SERVER_STATUS", payload: "stopped" });
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: String(e) });
    }
  }

  const statusColor: Record<ServerStatus, string> = {
    stopped:   "bg-slate-500",
    loading:   "bg-yellow-500 animate-pulse",
    ready:     "bg-green-500",
    reasoning: "bg-indigo-400 animate-pulse",
    error:     "bg-red-500",
  };

  const statusLabel: Record<ServerStatus, string> = {
    stopped:   "Stopped",
    loading:   "Loading model…",
    ready:     "Ready",
    reasoning: "Reasoning…",
    error:     "Error",
  };

  const canLaunch = serverStatus === "stopped" || serverStatus === "error";

  return (
    <div className="space-y-3">
      {state.errorMsg && (
        <div className="bg-red-900/30 border border-red-700 rounded px-3 py-2 text-xs text-red-300">
          {state.errorMsg}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusColor[serverStatus]}`} />
          <span className="text-sm text-slate-300">{statusLabel[serverStatus]}</span>
        </div>

        {canLaunch ? (
          <button
            onClick={handleLaunch}
            disabled={!config.last_model}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            Start server
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={serverStatus === "loading"}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors"
          >
            <Square className="w-4 h-4" />
            Stop server
          </button>
        )}

        {!config.last_model && (
          <span className="text-xs text-slate-500">Select a model first</span>
        )}
      </div>

      {/* Log tail */}
      <div>
        <button
          onClick={() => setLogOpen((p) => !p)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
        >
          {logOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Server log
        </button>
        {logOpen && (
          <div
            ref={logRef}
            className="mt-2 h-36 overflow-y-auto bg-slate-950 border border-slate-800 rounded p-2 font-mono text-xs text-slate-400"
          >
            {log.length === 0 ? (
              <span className="text-slate-600">No output yet.</span>
            ) : (
              log.map((line, i) => <div key={i}>{line}</div>)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
