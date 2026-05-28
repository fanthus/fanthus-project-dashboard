mod commands;
mod git;
mod models;
mod scanner;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::list_projects,
            commands::save_project,
            commands::project_from_path,
            commands::delete_project_record,
            commands::archive_project,
            commands::scan_directory,
            commands::read_readme,
            commands::get_git_info,
            commands::open_in_finder,
            commands::open_in_cursor,
            commands::open_in_xcode,
            commands::open_in_terminal,
            commands::run_script
        ])
        .run(tauri::generate_context!())
        .expect("failed to run ProjectDashboard");
}
