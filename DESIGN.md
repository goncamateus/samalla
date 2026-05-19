# Design — samalla

Visual language, component patterns, and UI decisions.

---

## Color palette

All colors are Tailwind CSS v4 slate/indigo tokens.

| Role | Token | Hex | Usage |
|---|---|---|---|
| Page background | `slate-900` | `#0f172a` | Body, main areas |
| Card background | `slate-800` | `#1e293b` | Cards, inputs, dropdowns |
| Border | `slate-700` | `#334155` | All borders |
| Text primary | `slate-100` | `#f1f5f9` | Headings, values |
| Text secondary | `slate-300` | `#cbd5e1` | Body text |
| Text muted | `slate-400` | `#94a3b8` | Labels, secondary info |
| Text dimmer | `slate-500` | `#64748b` | Placeholders, hints |
| Accent | `indigo-600` | `#4f46e5` | Active tab, primary buttons, active states |
| Accent light | `indigo-400` | `#818cf8` | Icons, CPU chart, RAM chart |
| Green | `green-500` | `#22c55e` | GPU icon, VRAM bar, server-ready dot |
| Amber | `amber-500` | `#f59e0b` | Swap bar, Swap chart |
| Orange | `orange-400` | `#fb923c` | CPU temp chart line |
| Red | `red-400` | `#f87171` | GPU temp chart line |
| Yellow | `yellow-500` | `#eab308` | Server-loading dot (pulsing) |

---

## Typography

- **Font**: system-ui stack (no custom font loaded)
- **Base size**: `text-sm` (14px) for body; `text-xs` (12px) for labels, log lines, model list items
- **Monospace**: server log, chat code blocks use `font-mono`

---

## Layout

### Shell

```
┌─ Header (40px, border-b) ─────────────────────────────┐
│  brand · [1. Load] [2. Chat] [3. Stats] · spacer       │
├────────────────────────────────────────────────────────┤
│  <main>  (flex-1, overflow-hidden)                     │
│   All three tab panes always mounted.                  │
│   Inactive panes: className="hidden"                   │
└────────────────────────────────────────────────────────┘
```

### Load tab (2-column)

```
┌── Left 50% ──────────────┬── Right 50% ──────────────┐
│  Models dir + llama-srv  │  Port                      │
│  ─────────────────────   │  Context size              │
│  Model picker            │  GPU layers / CPU MoE      │
│    [Local] [HuggingFace] │  Cache K / Cache V         │
│    scrollable list       │  Extra args                │
│                          │  ──────────────────        │
│                          │  Launch panel              │
└──────────────────────────┴────────────────────────────┘
```

### Chat tab

```
┌── Status bar (server info) ──────────────────────────┐
│  chat messages (flex-col, overflow-y-auto)           │
│    user bubbles: right-aligned, indigo bg            │
│    assistant bubbles: left-aligned, slate-800 bg     │
│      rendered with react-markdown + remark-gfm       │
├──────────────────────────────────────────────────────┤
│  Textarea + Send button                              │
└──────────────────────────────────────────────────────┘
```

### Stats tab (3 rows)

Each row: `flex gap-4 bg-slate-800 border rounded-lg p-4`

```
┌── Left pane (w-44) ─┬── Right pane (flex-1) ───────────┐
│  Icon + metric name  │  SVG polyline chart (80px tall)  │
│  Bar + value         │  ─ 2 lines, faint grid ─         │
│  Temp / other info   │  Legend: label + live value       │
└─────────────────────┴──────────────────────────────────┘
```

---

## Component conventions

### Inputs

All inputs use the same class pattern:
```
bg-slate-800 border border-slate-700 rounded px-3 py-1.5
text-sm text-slate-100 focus:outline-none focus:border-indigo-500
```

### Buttons

- **Primary action** (Start server, Send): `bg-indigo-600 hover:bg-indigo-500 text-white rounded`
- **Destructive** (Stop server): `bg-red-700 hover:bg-red-600 text-white rounded`
- **Ghost** (Browse, Refresh): `bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700`
- **Toggle group** (Context size): buttons fill width equally (`flex-1`), active = indigo bg

### Custom Select

Native `<select>` is avoided because WebKitGTK on Linux inherits the OS white background regardless of CSS. The custom `Select` component (`src/components/ui/Select.tsx`) uses a `div`-based dropdown:
- Trigger: matches input style exactly
- Menu: `absolute z-50 bg-slate-800 border border-slate-700 rounded shadow-lg mt-1`
- Active option: `bg-indigo-600/20 text-indigo-300`
- Closes on outside click via `useEffect` + `document.mousedown`

### Status dot

```tsx
<span className={`inline-block w-2.5 h-2.5 rounded-full ${statusColor[serverStatus]}`} />
```

| Status | Color | Animation |
|---|---|---|
| `stopped` | slate-500 | — |
| `loading` | yellow-500 | `animate-pulse` |
| `ready` | green-500 | — |
| `reasoning` | indigo-400 | `animate-pulse` |
| `error` | red-500 | — |

### MiniLineChart

SVG-based, no external library. Fixed `viewBox="0 0 300 80"` with `preserveAspectRatio="none"` so it stretches to fill any container width. Grid lines at 25 / 50 / 75 / 100% of Y range. Legend below shows live value for each series.

All series are normalized to a `max` value (100 for percentages and °C, total VRAM GB for VRAM) for y-axis scaling, while the legend displays the raw value with its unit.

---

## Spacing

Tailwind defaults; commonly used:
- `p-3` / `p-4`: card padding
- `gap-3` / `gap-4`: column/row gaps
- `space-y-3` / `space-y-4`: vertical stacks within forms/panels
- `mb-1` / `mb-2`: label-to-input spacing

---

## Icon

The app icon (`src-tauri/icons/icon.svg`) is a stylized llama wearing an indigo beret, with a small pencil detail. The beret and pencil represent the "designer" theme. Body uses a cool slate gradient; accent is the same indigo-600 used throughout the UI.

Source SVG: `src-tauri/icons/icon.svg`  
Generated sizes: `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.png` (512×512)
