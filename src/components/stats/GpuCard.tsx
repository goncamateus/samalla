import { Layers } from "lucide-react";
import { SystemStats } from "../../lib/tauri";
import MiniLineChart from "./MiniLineChart";

function Bar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-green-500 transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function fmt(mb: number) {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

export default function GpuCard({ stats, history }: { stats: SystemStats; history: SystemStats[] }) {
  const hasGpu = stats.gpu_vram_total_mb != null;
  const vramPct = hasGpu ? (stats.gpu_vram_used_mb! / stats.gpu_vram_total_mb!) * 100 : 0;

  return (
    <div className="flex gap-4 bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="w-44 shrink-0 space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
          <Layers className="w-4 h-4 text-green-400" />
          GPU (NVIDIA)
        </div>
        {!hasGpu ? (
          <p className="text-slate-500 text-xs">No NVIDIA GPU detected.</p>
        ) : (
          <>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>VRAM</span>
                <span className="text-slate-300">
                  {fmt(stats.gpu_vram_used_mb!)} / {fmt(stats.gpu_vram_total_mb!)}
                </span>
              </div>
              <Bar pct={vramPct} />
            </div>
          </>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {hasGpu ? (
          <MiniLineChart
            series={[
              {
                label: "Util",
                color: "#4ade80",
                data: history.map((s) => s.gpu_utilisation_pct ?? 0),
                max: 100,
                unit: " %",
                current: stats.gpu_utilisation_pct ?? 0,
              },
              {
                label: "Temp",
                color: "#f87171",
                data: history.map((s) => s.gpu_temp_celsius ?? 0),
                max: 100,
                unit: "°C",
                current: stats.gpu_temp_celsius ?? null,
              },
            ]}
          />
        ) : (
          <div className="flex items-center justify-center h-20 text-xs text-slate-600">
            No data
          </div>
        )}
      </div>
    </div>
  );
}
