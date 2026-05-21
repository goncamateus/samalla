import { useApp } from "../../contexts/AppContext";
import Select from "../ui/Select";

const CONTEXT_SIZES = [
  { label: "16k", value: 16384 },
  { label: "32k", value: 32768 },
  { label: "64k", value: 65536 },
  { label: "128k", value: 131072 },
  { label: "256k", value: 262144 },
  { label: "Max", value: 0 },
];

const CACHE_K_OPTIONS = ["f16", "q8_0", "q4_0", "q4_k", "q5_k", "turbo4"];
const CACHE_V_OPTIONS = ["f16", "q8_0", "q4_0", "q4_k", "q5_k", "turbo3"];

export default function ServerConfigForm() {
  const { state, dispatch } = useApp();
  const { config } = state;

  const patch = (payload: Parameters<typeof dispatch>[0] extends { payload: infer P } ? P : never) =>
    dispatch({ type: "PATCH_CONFIG", payload: payload as Partial<typeof config> });

  return (
    <div className="space-y-4">
      {/* Bind host + port */}
      <div className="flex gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Bind address
          </label>
          <input
            type="text"
            value={config.bind_host}
            onChange={(e) => patch({ bind_host: e.target.value })}
            className="w-36 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            placeholder="127.0.0.1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Port
          </label>
          <input
            type="number"
            value={config.server_port}
            onChange={(e) => patch({ server_port: Number(e.target.value) })}
            className="w-24 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            min={1024}
            max={65535}
          />
        </div>
      </div>

      {/* Context size toggle */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Context size
        </label>
        <div className="flex gap-1">
          {CONTEXT_SIZES.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => patch({ context_size: value })}
              className={`flex-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                config.context_size === value
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* GPU layers + CPU MoE */}
      <div className="flex gap-6">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            GPU layers (n-gpu-layers)
          </label>
          <input
            type="number"
            value={config.n_gpu_layers}
            onChange={(e) => patch({ n_gpu_layers: Number(e.target.value) })}
            className="w-24 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            min={0}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            CPU MoE layers (n-cpu-moe)
          </label>
          <input
            type="number"
            value={config.n_cpu_moe}
            onChange={(e) => patch({ n_cpu_moe: Number(e.target.value) })}
            className="w-24 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            min={0}
          />
        </div>
      </div>

      {/* Cache types */}
      <div className="flex gap-6">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Cache type K
          </label>
          <Select
            value={config.cache_type_k}
            options={CACHE_K_OPTIONS}
            onChange={(v) => patch({ cache_type_k: v })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Cache type V
          </label>
          <Select
            value={config.cache_type_v}
            options={CACHE_V_OPTIONS}
            onChange={(v) => patch({ cache_type_v: v })}
          />
        </div>
      </div>

      {/* Extra args */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Extra arguments
        </label>
        <input
          type="text"
          value={config.extra_args}
          onChange={(e) => patch({ extra_args: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. --threads 8 --flash-attn"
        />
      </div>
    </div>
  );
}
