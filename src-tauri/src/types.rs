use serde::{Deserialize, Serialize};

fn default_bind_host() -> String {
    "127.0.0.1".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    pub name: String,
    pub last_model: String,
    pub context_size: u32,
    pub n_gpu_layers: i32,
    pub n_cpu_moe: i32,
    pub cache_type_k: String,
    pub cache_type_v: String,
    pub extra_args: String,
    pub server_port: u16,
    #[serde(default = "default_bind_host")]
    pub bind_host: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub models_dir: String,
    pub llama_server_path: String,
    pub last_model: String,
    pub context_size: u32,
    pub n_gpu_layers: i32,
    pub n_cpu_moe: i32,
    pub cache_type_k: String,
    pub cache_type_v: String,
    pub extra_args: String,
    pub server_port: u16,
    #[serde(default = "default_bind_host")]
    pub bind_host: String,
    #[serde(default)]
    pub profiles: Vec<Profile>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            models_dir: dirs::home_dir()
                .unwrap_or_default()
                .join("models")
                .to_string_lossy()
                .to_string(),
            llama_server_path: "llama-server".to_string(),
            last_model: String::new(),
            context_size: 65536,
            n_gpu_layers: 33,
            n_cpu_moe: 0,
            cache_type_k: "q8_0".to_string(),
            cache_type_v: "q8_0".to_string(),
            extra_args: String::new(),
            server_port: 8080,
            bind_host: default_bind_host(),
            profiles: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStats {
    pub cpu_usage_pct: f32,
    pub cpu_temp_celsius: Option<f32>,
    pub ram_used_mb: u64,
    pub ram_total_mb: u64,
    pub swap_used_mb: u64,
    pub swap_total_mb: u64,
    pub gpu_vram_used_mb: Option<u64>,
    pub gpu_vram_total_mb: Option<u64>,
    pub gpu_temp_celsius: Option<u32>,
    pub gpu_utilisation_pct: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HfModel {
    #[serde(rename = "modelId")]
    pub model_id: String,
    pub downloads: Option<u64>,
    #[serde(rename = "lastModified")]
    pub last_modified: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HfRepoInfo {
    #[serde(default)]
    pub siblings: Vec<HfSibling>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HfSibling {
    pub rfilename: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub bytes_done: u64,
    pub bytes_total: Option<u64>,
    pub pct: Option<f32>,
}
