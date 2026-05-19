# Agent Guide — samalla

A concise reference for AI coding agents working on this codebase.

## Project at a glance

**samalla** is a Linux desktop GUI that wraps [`llama-server`](https://github.com/ggml-org/llama.cpp) (llama.cpp).
Stack: **Tauri 2** (WebKitGTK + Rust backend) · **React 18** · **Tailwind CSS v4** · **TypeScript**.

Three tabs: **Load** (pick model, configure server, launch) · **Chat** (SSE streaming) · **Stats** (CPU/RAM/GPU live charts).

---

## Repository layout

```
samalla/
├── src/                          ← React frontend
│   ├── App.tsx                   ← Tab shell, Load tab layout
│   ├── contexts/AppContext.tsx   ← Global state (useReducer) + config auto-save
│   ├── lib/
│   │   ├── tauri.ts              ← Typed invoke() wrappers for every Rust command
│   │   └── api.ts                ← SSE streaming helper for /v1/chat/completions
│   └── components/
│       ├── load/
│       │   ├── ModelPicker.tsx   ← Local GGUF list + HuggingFace search/download
│       │   ├── HfSearch.tsx      ← Debounced HF search, file picker, download progress
│       │   ├── ServerConfigForm.tsx  ← Port, ctx-size, GPU layers, cache types, extra-args
│       │   └── LaunchPanel.tsx   ← Start/Stop, status dot, server log tail
│       ├── chat/
│       │   ├── ChatSection.tsx   ← SSE consumer, message list
│       │   ├── ChatWindow.tsx    ← Renders messages; assistant bubbles use react-markdown
│       │   └── ChatInput.tsx     ← Textarea + send button
│       ├── stats/
│       │   ├── StatsPanel.tsx    ← 2 s poll, rolling 60-sample history buffer
│       │   ├── MiniLineChart.tsx ← SVG polyline chart (no external charting lib)
│       │   ├── CpuCard.tsx       ← Usage % + temp; indigo/orange chart
│       │   ├── MemCard.tsx       ← RAM + Swap %; indigo/amber chart
│       │   └── GpuCard.tsx       ← VRAM GB + Util %; green/red chart
│       └── ui/
│           └── Select.tsx        ← Custom dark-themed dropdown (native select has OS white bg on Linux)
└── src-tauri/
    ├── tauri.conf.json           ← Window 900×700, min 900×700
    ├── Cargo.toml
    └── src/
        ├── lib.rs                ← Tauri builder; RunEvent::Exit kills child process
        ├── state.rs              ← AppState: Mutex<Option<Child>> + Arc<Mutex<VecDeque>> log
        ├── types.rs              ← AppConfig, ServerConfig, SystemStats, HfModel, DownloadProgress
        └── commands/
            ├── mod.rs
            ├── server.rs         ← launch_server, stop_server, get_server_status, get_server_log
            ├── models.rs         ← list_local_models (walks **.gguf, skips mmproj*), search_hf, download_hf_model
            ├── stats.rs          ← get_system_stats (sysinfo 0.33 + nvml-wrapper 0.10)
            └── config.rs         ← load_config / save_config → ~/.config/samalla/config.json
```

---

## How to build & run

```bash
# Prerequisites: Rust toolchain, Node ≥ 18, webkit2gtk, llama-server in PATH
cd samalla
npm install
npm run tauri dev        # hot-reload dev mode
npm run tauri build      # production binary → src-tauri/target/release/
```

---

## Key design decisions

| Decision | Rationale |
|---|---|
| All tabs always mounted, hidden with CSS `hidden` class | Prevents re-mounting (avoids re-scanning models, resetting chat) on tab switch |
| `RunEvent::Exit` hook in `lib.rs` to kill child | Tauri wraps managed state in `Arc`; `Drop` is never called reliably |
| Custom `Select` component instead of `<select>` | WebKitGTK on Linux inherits OS white background for native select elements |
| HTTP polling `/health` + `/slots` | Richer status (loading / ready / reasoning) than binary process alive/dead |
| SVG polyline charts (no charting library) | Zero dependencies; sufficient for simple 2-line time-series |
| `nvml-wrapper` for GPU stats | NVIDIA-only; gracefully returns `None` for all fields if no GPU or NVML unavailable |

---

## State shape (`AppContext`)

```ts
interface AppState {
  config: AppConfig;         // synced to ~/.config/samalla/config.json (500 ms debounce)
  serverStatus: ServerStatus; // "stopped" | "loading" | "ready" | "reasoning" | "error"
  activeTab: "load" | "chat" | "stats";
  errorMsg: string | null;
}
```

`dispatch({ type: "PATCH_CONFIG", payload: Partial<AppConfig> })` is the main mutation path for the Load tab.

---

## Rust commands reference

| Command | Signature | Notes |
|---|---|---|
| `launch_server` | `(config: ServerConfig) → Result<()>` | Spawns child, stores handle in `AppState.process` |
| `stop_server` | `() → Result<()>` | `.take()` guard before `.kill().await` (avoids Send error) |
| `get_server_status` | `() → String` | `"running"` / `"stopped"` |
| `get_server_log` | `() → Vec<String>` | Last 200 lines from stderr ring buffer |
| `list_local_models` | `(dir: String) → Vec<String>` | Recursive; excludes `mmproj*` |
| `search_hf` | `(query: String) → Result<Vec<HfModel>>` | HF API, filter=gguf, limit=20 |
| `get_hf_repo_files` | `(repo_id: String) → Result<Vec<String>>` | Lists `.gguf` siblings |
| `download_hf_model` | `(repo, filename, dest, app) → Result<String>` | Streams bytes, emits `download-progress` events |
| `get_system_stats` | `() → SystemStats` | sysinfo + nvml; all GPU fields `Option` |
| `load_config` | `() → AppConfig` | Reads `~/.config/samalla/config.json`, returns defaults on missing |
| `save_config` | `(config: AppConfig) → Result<()>` | Writes same path |

---

## Common tasks

**Add a new server flag**: add field to `AppConfig` in `types.rs` → add input to `ServerConfigForm.tsx` → wire into `launch_server` CLI construction in `server.rs`.

**Add a new stats metric**: add field to `SystemStats` in `types.rs` → collect it in `stats.rs` → expose in the appropriate card component; the rolling history is already passed down from `StatsPanel`.

**Change default config values**: edit the `Default` impl in `types.rs`.

**Adjust poll intervals**: `LaunchPanel.tsx` uses `1500 ms` while loading, `20000 ms` while ready. `StatsPanel.tsx` polls every `2000 ms`.
