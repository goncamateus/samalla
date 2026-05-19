import { useEffect, useState } from "react";
import { getSystemStats, SystemStats } from "../../lib/tauri";
import CpuCard from "./CpuCard";
import GpuCard from "./GpuCard";
import MemCard from "./MemCard";

const MAX_HISTORY = 60;

export default function StatsPanel() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [history, setHistory] = useState<SystemStats[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tick = async () => {
      try {
        const s = await getSystemStats();
        setStats(s);
        setHistory((prev) => {
          const next = [...prev, s];
          return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
        });
        setError(null);
      } catch (e) {
        setError(String(e));
      }
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, []);

  if (error) return <p className="text-red-400 text-sm p-4">{error}</p>;
  if (!stats) return <p className="text-slate-500 text-sm p-4">Loading stats…</p>;

  return (
    <div className="p-4 space-y-3 h-full overflow-y-auto">
      <CpuCard stats={stats} history={history} />
      <MemCard stats={stats} history={history} />
      <GpuCard stats={stats} history={history} />
    </div>
  );
}
