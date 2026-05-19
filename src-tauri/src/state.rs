use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use tokio::process::Child;

use crate::types::AppConfig;

pub struct AppState {
    pub process: Mutex<Option<Child>>,
    pub config: Mutex<AppConfig>,
    pub log_buffer: Arc<Mutex<VecDeque<String>>>,
}

impl AppState {
    pub fn new(config: AppConfig) -> Self {
        Self {
            process: Mutex::new(None),
            config: Mutex::new(config),
            log_buffer: Arc::new(Mutex::new(VecDeque::with_capacity(200))),
        }
    }
}
