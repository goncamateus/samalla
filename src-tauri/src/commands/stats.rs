use sysinfo::{Components, System};

use crate::types::SystemStats;

#[tauri::command]
pub fn get_system_stats() -> SystemStats {
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpu_usage_pct = sys.global_cpu_usage();

    let components = Components::new_with_refreshed_list();
    let cpu_temp_celsius = components
        .iter()
        .find(|c| {
            let label = c.label().to_lowercase();
            label.contains("package")
                || label.contains("cpu")
                || label.contains("tctl")
                || label.contains("k10temp")
                || label.contains("core 0")
        })
        .or_else(|| components.iter().next())
        .and_then(|c| c.temperature());

    let ram_used_mb = sys.used_memory() / 1024 / 1024;
    let ram_total_mb = sys.total_memory() / 1024 / 1024;
    let swap_used_mb = sys.used_swap() / 1024 / 1024;
    let swap_total_mb = sys.total_swap() / 1024 / 1024;

    let (gpu_vram_used_mb, gpu_vram_total_mb, gpu_temp_celsius, gpu_utilisation_pct) =
        query_nvidia_gpu();

    SystemStats {
        cpu_usage_pct,
        cpu_temp_celsius,
        ram_used_mb,
        ram_total_mb,
        swap_used_mb,
        swap_total_mb,
        gpu_vram_used_mb,
        gpu_vram_total_mb,
        gpu_temp_celsius,
        gpu_utilisation_pct,
    }
}

fn query_nvidia_gpu() -> (Option<u64>, Option<u64>, Option<u32>, Option<u32>) {
    use nvml_wrapper::Nvml;
    let nvml = match Nvml::init() {
        Ok(n) => n,
        Err(_) => return (None, None, None, None),
    };
    let device = match nvml.device_by_index(0) {
        Ok(d) => d,
        Err(_) => return (None, None, None, None),
    };

    let vram_used = device
        .memory_info()
        .ok()
        .map(|m| m.used / 1024 / 1024);
    let vram_total = device
        .memory_info()
        .ok()
        .map(|m| m.total / 1024 / 1024);
    let temp = device
        .temperature(nvml_wrapper::enum_wrappers::device::TemperatureSensor::Gpu)
        .ok();
    let util = device
        .utilization_rates()
        .ok()
        .map(|u| u.gpu);

    (vram_used, vram_total, temp, util)
}
