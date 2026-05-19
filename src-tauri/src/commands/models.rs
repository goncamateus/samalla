use std::path::Path;
use futures_util::StreamExt;
use tauri::{AppHandle, Emitter};

use crate::types::{DownloadProgress, HfModel, HfRepoInfo};

#[tauri::command]
pub fn list_local_models(dir: String) -> Vec<String> {
    let path = Path::new(&dir);
    if !path.is_dir() {
        return vec![];
    }
    walkdir_gguf(path)
}

fn walkdir_gguf(dir: &Path) -> Vec<String> {
    let mut results = Vec::new();
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir() {
                results.extend(walkdir_gguf(&p));
            } else if p.extension().and_then(|e| e.to_str()) == Some("gguf")
                && !p.file_name()
                    .and_then(|n| n.to_str())
                    .map(|n| n.starts_with("mmproj"))
                    .unwrap_or(false)
            {
                if let Some(s) = p.to_str() {
                    results.push(s.to_string());
                }
            }
        }
    }
    results
}

#[tauri::command]
pub async fn search_hf(query: String) -> Result<Vec<HfModel>, String> {
    let url = format!(
        "https://huggingface.co/api/models?search={}&filter=gguf&limit=20&sort=downloads",
        urlencoding::encode(&query)
    );
    let client = reqwest::Client::new();
    let models: Vec<HfModel> = client
        .get(&url)
        .header("User-Agent", "goncllama/0.1")
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    Ok(models)
}

#[tauri::command]
pub async fn get_hf_repo_files(repo_id: String) -> Result<Vec<String>, String> {
    let url = format!("https://huggingface.co/api/models/{}", repo_id);
    let client = reqwest::Client::new();
    let info: HfRepoInfo = client
        .get(&url)
        .header("User-Agent", "goncllama/0.1")
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    Ok(info
        .siblings
        .into_iter()
        .filter(|s| s.rfilename.ends_with(".gguf"))
        .map(|s| s.rfilename)
        .collect())
}

#[tauri::command]
pub async fn download_hf_model(
    repo_id: String,
    filename: String,
    dest_dir: String,
    app: AppHandle,
) -> Result<String, String> {
    let url = format!(
        "https://huggingface.co/{}/resolve/main/{}",
        repo_id, filename
    );
    let dest_path = Path::new(&dest_dir).join(&filename);
    if let Some(parent) = dest_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .header("User-Agent", "goncllama/0.1")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let total = resp.content_length();
    let mut downloaded: u64 = 0;
    let mut stream = resp.bytes_stream();
    let mut file = std::fs::File::create(&dest_path).map_err(|e| e.to_string())?;

    use std::io::Write;
    while let Some(chunk) = stream.next().await {
        let bytes = chunk.map_err(|e| e.to_string())?;
        file.write_all(&bytes).map_err(|e| e.to_string())?;
        downloaded += bytes.len() as u64;
        let pct = total.map(|t| (downloaded as f32 / t as f32) * 100.0);
        let _ = app.emit(
            "download-progress",
            DownloadProgress {
                bytes_done: downloaded,
                bytes_total: total,
                pct,
            },
        );
    }

    Ok(dest_path.to_string_lossy().to_string())
}
