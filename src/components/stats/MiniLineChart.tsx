interface ChartSeries {
  label: string;
  color: string;
  data: number[];
  max: number;
  unit: string;
  current: number | null;
}

const VW = 300, VH = 80, PAD = 6;

function toPoints(data: number[], max: number): string {
  if (data.length < 2 || max <= 0) return "";
  const xStep = VW / (data.length - 1);
  return data
    .map((v, i) => {
      const x = i * xStep;
      const norm = Math.max(0, Math.min(1, v / max));
      const y = VH - PAD - norm * (VH - 2 * PAD);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function MiniLineChart({ series }: { series: ChartSeries[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div style={{ height: 80 }} className="w-full">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1="0" y1={VH - PAD - f * (VH - 2 * PAD)}
              x2={VW} y2={VH - PAD - f * (VH - 2 * PAD)}
              stroke="#1e293b" strokeWidth="1"
            />
          ))}
          <line x1="0" y1={VH - PAD} x2={VW} y2={VH - PAD} stroke="#1e293b" strokeWidth="1" />
          {series.map((s) => (
            <polyline
              key={s.label}
              points={toPoints(s.data, s.max)}
              fill="none"
              stroke={s.color}
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </svg>
      </div>
      <div className="flex gap-4 flex-wrap">
        {series.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span
              className="inline-block w-4 rounded-full shrink-0"
              style={{ height: 2, backgroundColor: s.color }}
            />
            <span className="text-xs text-slate-500">{s.label}</span>
            <span className="text-xs font-mono font-medium" style={{ color: s.color }}>
              {s.current != null
                ? `${Number.isInteger(s.current) ? s.current : s.current.toFixed(1)}${s.unit}`
                : "N/A"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
