# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**samalla** is a Linux desktop GUI (Tauri 2 + React 18 + TypeScript + Tailwind CSS v4) that wraps `llama-server` from llama.cpp. See [AGENTS.md](AGENTS.md) for full codebase orientation (repo layout, Rust commands reference, key design decisions) and [DESIGN.md](DESIGN.md) for UI conventions, color palette, and component patterns.

## Commands

```bash
# Dev mode (hot-reload)
make dev                  # env -u LD_LIBRARY_PATH npm run tauri dev

# Production build → src-tauri/target/release/samalla
make build

# Run all checks (cargo check, clippy -D warnings, tsc --noEmit)
make check

# Install to ~/.local/bin + desktop entry
make install

# Install pre-push git hook (runs make check before every push)
make hooks
```

No test suite exists — `make check` is the CI gate.

## Architecture

### Data flow

```
AppContext (useReducer)
  └── config: AppConfig     ← synced to ~/.config/samalla/config.json (500 ms debounce)
  └── serverStatus           ← polled via Tauri invoke("get_server_status") + /health + /slots
  └── activeTab

Load tab → ServerConfigForm + LaunchPanel → Tauri commands (launch_server / stop_server)
Chat tab → ChatSection → SSE via lib/api.ts → llama-server /v1/chat/completions
Stats tab → StatsPanel → Tauri invoke("get_system_stats") every 2 s
```

### Frontend → Rust bridge

All Tauri command calls go through typed wrappers in `src/lib/tauri.ts`. When adding a new Rust command:
1. Add it to `src-tauri/src/commands/` and register in `lib.rs`
2. Add a typed wrapper in `src/lib/tauri.ts`
3. Call only the wrapper, never `invoke()` directly from components

### Adding features

- **New server flag**: `AppConfig` in `types.rs` → input in `ServerConfigForm.tsx` → CLI construction in `server.rs:launch_server`
- **New stats metric**: `SystemStats` in `types.rs` → collect in `stats.rs` → add to card component
- **Default config values**: edit `Default` impl in `types.rs`
- **Poll intervals**: `LaunchPanel.tsx` (1500 ms loading / 20000 ms ready), `StatsPanel.tsx` (2000 ms)

## Key constraints

- **Custom `Select` component** — never use native `<select>`; WebKitGTK inherits OS white background regardless of CSS.
- **All tabs always mounted** — hidden with CSS `hidden` class, not conditionally rendered. This prevents re-scanning models and resetting chat on tab switch.
- **`LD_LIBRARY_PATH` must be unset** for dev mode on some Linux distros (hence `env -u` in `make dev`).
- **GPU stats are NVIDIA-only** via `nvml-wrapper`; all GPU fields in `SystemStats` are `Option<T>` and gracefully return `None` when NVML is unavailable.
- **No charting library** — stats charts use hand-rolled SVG polylines in `MiniLineChart.tsx`.
