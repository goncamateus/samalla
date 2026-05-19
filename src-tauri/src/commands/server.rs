use std::collections::VecDeque;
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use tauri::State;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

use crate::state::AppState;
use crate::types::AppConfig;

fn push_log(buf: &mut VecDeque<String>, line: String) {
    if buf.len() >= 200 {
        buf.pop_front();
    }
    buf.push_back(line);
}

#[tauri::command]
pub async fn launch_server(config: AppConfig, state: State<'_, AppState>) -> Result<(), String> {
    {
        let proc_guard = state.process.lock().unwrap();
        if proc_guard.is_some() {
            return Err("Server is already running".to_string());
        }
    }

    let mut cmd = Command::new(&config.llama_server_path);
    cmd.arg("--model").arg(&config.last_model);
    cmd.arg("--ctx-size").arg(config.context_size.to_string());
    cmd.arg("--n-gpu-layers").arg(config.n_gpu_layers.to_string());
    cmd.arg("--n-cpu-moe").arg(config.n_cpu_moe.to_string());
    cmd.arg("--cache-type-k").arg(&config.cache_type_k);
    cmd.arg("--cache-type-v").arg(&config.cache_type_v);
    cmd.arg("--host").arg("127.0.0.1");
    cmd.arg("--port").arg(config.server_port.to_string());

    for arg in config.extra_args.split_whitespace() {
        cmd.arg(arg);
    }

    cmd.stdout(Stdio::null()).stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn llama-server: {e}"))?;

    if let Some(stderr) = child.stderr.take() {
        let log_buf: Arc<Mutex<VecDeque<String>>> = state.log_buffer.clone();
        tokio::spawn(async move {
            let mut reader = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let mut buf = log_buf.lock().unwrap();
                push_log(&mut buf, line);
            }
        });
    }

    *state.process.lock().unwrap() = Some(child);
    Ok(())
}

#[tauri::command]
pub async fn stop_server(state: State<'_, AppState>) -> Result<(), String> {
    let child = state.process.lock().unwrap().take();
    if let Some(mut child) = child {
        child.kill().await.map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_server_status(state: State<AppState>) -> String {
    let mut guard = state.process.lock().unwrap();
    if let Some(child) = guard.as_mut() {
        match child.try_wait() {
            Ok(None) => "running".to_string(),
            _ => {
                *guard = None;
                "stopped".to_string()
            }
        }
    } else {
        "stopped".to_string()
    }
}

#[tauri::command]
pub fn get_server_log(state: State<AppState>) -> Vec<String> {
    state.log_buffer.lock().unwrap().iter().cloned().collect()
}
