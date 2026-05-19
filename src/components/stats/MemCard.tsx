import { MemoryStick } from "lucide-react";
import { SystemStats } from "../../lib/tauri";
import MiniLineChart from "./MiniLineChart";

function Bar({ used, total, color }: { used: number; total: number; color: string }) {
  const pct = total > 0 ? (used / total) * 100 : 0;
  return (
    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function fmt(mb: number) {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

export default function MemCard({ stats, history }: { stats: SystemStats; history: SystemStats[] }) {
  const ramPct = stats.ram_total_mb > 0 ? (stats.ram_used_mb / stats.ram_total_mb) * 100 : 0;
  const swapPct = stats.swap_total_mb > 0 ? (stats.swap_used_mb / stats.swap_total_mb) * 100 : 0;

  return (
    <div className="flex gap-4 bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="w-44 shrink-0 space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
          <MemoryStick className="w-4 h-4 text-indigo-400" />
          Memory
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>RAM</span>
            <span className="text-slate-300">{fmt(stats.ram_used_mb)} / {fmt(stats.ram_total_mb)}</span>
          </div>
          <Bar used={stats.ram_used_mb} total={stats.ram_total_mb} color="bg-indigo-500" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Swap</span>
            <span className="text-slate-300">{fmt(stats.swap_used_mb)} / {fmt(stats.swap_total_mb)}</span>
          </div>
          <Bar used={stats.swap_used_mb} total={stats.swap_total_mb} color="bg-amber-500" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <MiniLineChart
          series={[
            {
              label: "RAM",
              color: "#818cf8",
              data: history.map((s) =>
                s.ram_total_mb > 0 ? (s.ram_used_mb / s.ram_total_mb) * 100 : 0
              ),
              max: 100,
              unit: "%",
              current: ramPct,
            },
            {
              label: "Swap",
              color: "#fbbf24",
              data: history.map((s) =>
                s.swap_total_mb > 0 ? (s.swap_used_mb / s.swap_total_mb) * 100 : 0
              ),
              max: 100,
              unit: "%",
              current: swapPct,
            },
          ]}
        />
      </div>
    </div>
  );
}
