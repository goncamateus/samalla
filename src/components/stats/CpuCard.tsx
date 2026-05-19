import { Cpu } from "lucide-react";
import { SystemStats } from "../../lib/tauri";
import MiniLineChart from "./MiniLineChart";

function Bar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-indigo-500 transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

export default function CpuCard({ stats, history }: { stats: SystemStats; history: SystemStats[] }) {
  return (
    <div className="flex gap-4 bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="w-44 shrink-0 space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
          <Cpu className="w-4 h-4 text-indigo-400" />
          CPU
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Usage</span>
            <span className="text-slate-300">{stats.cpu_usage_pct.toFixed(1)}%</span>
          </div>
          <Bar pct={stats.cpu_usage_pct} />
        </div>
        <div className="text-xs text-slate-400">
          Temp:{" "}
          <span className="text-slate-300">
            {stats.cpu_temp_celsius != null ? `${stats.cpu_temp_celsius.toFixed(1)} °C` : "N/A"}
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <MiniLineChart
          series={[
            {
              label: "Usage",
              color: "#818cf8",
              data: history.map((s) => s.cpu_usage_pct),
              max: 100,
              unit: "%",
              current: stats.cpu_usage_pct,
            },
            {
              label: "Temp",
              color: "#fb923c",
              data: history.map((s) => s.cpu_temp_celsius ?? 0),
              max: 100,
              unit: "°C",
              current: stats.cpu_temp_celsius,
            },
          ]}
        />
      </div>
    </div>
  );
}
