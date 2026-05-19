mod commands;
mod state;
mod types;

use commands::{config::*, models::*, server::*, stats::*};
use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config = commands::config::load_config_from_disk();
    let app_state = AppState::new(config);

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            load_config,
            save_config,
            launch_server,
            stop_server,
            get_server_status,
            get_server_log,
            list_local_models,
            search_hf,
            get_hf_repo_files,
            download_hf_model,
            get_system_stats,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let tauri::RunEvent::Exit = event {
            let state = app_handle.state::<AppState>();
            let mut guard = state.process.lock().unwrap();
            if let Some(child) = guard.as_mut() {
                let _ = child.start_kill();
            }
        }
    });
}
