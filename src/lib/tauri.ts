import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface Profile {
  name: string;
  last_model: string;
  context_size: number;
  n_gpu_layers: number;
  n_cpu_moe: number;
  cache_type_k: string;
  cache_type_v: string;
  extra_args: string;
  server_port: number;
}

export interface AppConfig {
  models_dir: string;
  llama_server_path: string;
  last_model: string;
  context_size: number;
  n_gpu_layers: number;
  n_cpu_moe: number;
  cache_type_k: string;
  cache_type_v: string;
  extra_args: string;
  server_port: number;
  profiles: Profile[];
}

export interface SystemStats {
  cpu_usage_pct: number;
  cpu_temp_celsius: number | null;
  ram_used_mb: number;
  ram_total_mb: number;
  swap_used_mb: number;
  swap_total_mb: number;
  gpu_vram_used_mb: number | null;
  gpu_vram_total_mb: number | null;
  gpu_temp_celsius: number | null;
  gpu_utilisation_pct: number | null;
}

export interface HfModel {
  modelId: string;
  downloads: number | null;
  lastModified: string | null;
}

export interface DownloadProgress {
  bytes_done: number;
  bytes_total: number | null;
  pct: number | null;
}

export const DEFAULT_CONFIG: AppConfig = {
  models_dir: "",
  llama_server_path: "llama-server",
  last_model: "",
  context_size: 65536,
  n_gpu_layers: 33,
  n_cpu_moe: 0,
  cache_type_k: "q8_0",
  cache_type_v: "q8_0",
  extra_args: "",
  server_port: 8080,
  profiles: [],
};

export const loadConfig = () => invoke<AppConfig>("load_config");
export const saveConfig = (config: AppConfig) =>
  invoke<void>("save_config", { config });
export const launchServer = (config: AppConfig) =>
  invoke<void>("launch_server", { config });
export const stopServer = () => invoke<void>("stop_server");
export const getServerStatus = () => invoke<string>("get_server_status");
export const getServerLog = () => invoke<string[]>("get_server_log");
export const listLocalModels = (dir: string) =>
  invoke<string[]>("list_local_models", { dir });
export const searchHf = (query: string) =>
  invoke<HfModel[]>("search_hf", { query });
export const getHfRepoFiles = (repoId: string) =>
  invoke<string[]>("get_hf_repo_files", { repoId });
export const downloadHfModel = (
  repoId: string,
  filename: string,
  destDir: string
) => invoke<string>("download_hf_model", { repoId, filename, destDir });
export const getSystemStats = () => invoke<SystemStats>("get_system_stats");

export const onDownloadProgress = (
  cb: (p: DownloadProgress) => void
) => listen<DownloadProgress>("download-progress", (e) => cb(e.payload));
