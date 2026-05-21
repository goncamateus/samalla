import { useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Profile } from "../../lib/tauri";
import { useApp } from "../../contexts/AppContext";

export default function ProfilesPanel() {
  const { state, dispatch } = useApp();
  const { config } = state;

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startSave() {
    setSaving(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function cancelSave() {
    setSaving(false);
    setName("");
  }

  function confirmSave() {
    const trimmed = name.trim();
    if (!trimmed) return;

    const newProfile: Profile = {
      name: trimmed,
      last_model: config.last_model,
      context_size: config.context_size,
      n_gpu_layers: config.n_gpu_layers,
      n_cpu_moe: config.n_cpu_moe,
      cache_type_k: config.cache_type_k,
      cache_type_v: config.cache_type_v,
      extra_args: config.extra_args,
      server_port: config.server_port,
    };

    const updated = [
      ...config.profiles.filter((p) => p.name !== trimmed),
      newProfile,
    ];
    dispatch({ type: "PATCH_CONFIG", payload: { profiles: updated } });
    setSaving(false);
    setName("");
  }

  function loadProfile(profile: Profile) {
    const { name: _name, ...fields } = profile;
    dispatch({ type: "PATCH_CONFIG", payload: fields });
  }

  function deleteProfile(profileName: string, e: React.MouseEvent) {
    e.stopPropagation();
    dispatch({
      type: "PATCH_CONFIG",
      payload: { profiles: config.profiles.filter((p) => p.name !== profileName) },
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Profiles
        </span>
        {!saving && (
          <button
            onClick={startSave}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Save current
          </button>
        )}
      </div>

      {saving && (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmSave();
              if (e.key === "Escape") cancelSave();
            }}
            placeholder="Profile name…"
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={confirmSave}
            disabled={!name.trim()}
            className="p-1 rounded text-green-400 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={cancelSave}
            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {config.profiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {config.profiles.map((profile) => (
            <button
              key={profile.name}
              onClick={() => loadProfile(profile)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:bg-slate-700 hover:border-indigo-500 transition-colors group"
            >
              {profile.name}
              <span
                onClick={(e) => deleteProfile(profile.name, e)}
                className="text-slate-600 hover:text-red-400 transition-colors"
                role="button"
                aria-label={`Delete profile ${profile.name}`}
              >
                <X className="w-3 h-3" />
              </span>
            </button>
          ))}
        </div>
      )}

      {config.profiles.length === 0 && !saving && (
        <p className="text-xs text-slate-600">No profiles saved yet.</p>
      )}
    </div>
  );
}
