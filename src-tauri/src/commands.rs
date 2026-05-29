use crate::{
    git,
    models::{GitInfo, Project, ProjectStore, ScannedProject, ScriptResult},
    scanner, storage,
};
use chrono::Utc;
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
};

#[tauri::command]
pub fn list_projects() -> Result<ProjectStore, String> {
    storage::load_store()
}

#[tauri::command]
pub fn save_project(mut project: Project) -> Result<Project, String> {
    validate_project_payload(&mut project)?;
    storage::upsert_project(project)
}

#[tauri::command]
pub fn project_from_path(path: String) -> Result<Project, String> {
    let path = validate_project_directory(&path)?;
    let name = path
        .file_name()
        .and_then(|name| name.to_str())
        .filter(|name| !name.trim().is_empty())
        .unwrap_or("Untitled Project")
        .to_string();
    let now = Utc::now().to_rfc3339();

    Ok(Project {
        id: String::new(),
        name,
        path: path.to_string_lossy().to_string(),
        description: String::new(),
        status: "active".to_string(),
        tags: Vec::new(),
        progress: String::new(),
        next_steps: String::new(),
        scripts: Vec::new(),
        created_at: now.clone(),
        updated_at: now,
        archived_at: None,
    })
}

#[tauri::command]
pub fn delete_project_record(project_id: String) -> Result<(), String> {
    if project_id.trim().is_empty() {
        return Err("Project id is required".to_string());
    }
    storage::delete_record(&project_id)
}

#[tauri::command]
pub fn archive_project(project_id: String) -> Result<Project, String> {
    if project_id.trim().is_empty() {
        return Err("Project id is required".to_string());
    }
    storage::archive_record(&project_id)
}

#[tauri::command]
pub fn scan_directory(path: String) -> Result<Vec<ScannedProject>, String> {
    scanner::scan_directory(&path)
}

#[tauri::command]
pub fn read_readme(project_path: String) -> Result<Option<String>, String> {
    let path = ensure_saved_project_path(&project_path)?;
    for filename in ["README.md", "readme.md", "README"] {
        let readme_path = path.join(filename);
        if readme_path.exists() && readme_path.is_file() {
            return fs::read_to_string(&readme_path)
                .map(Some)
                .map_err(|err| format!("Unable to read {}: {err}", readme_path.display()));
        }
    }
    Ok(None)
}

#[tauri::command]
pub fn get_git_info(project_path: String) -> Result<GitInfo, String> {
    let path = ensure_saved_project_path(&project_path)?;
    git::get_git_info(&path.to_string_lossy())
}

#[tauri::command]
pub fn open_in_finder(project_path: String) -> Result<(), String> {
    let path = ensure_saved_project_path(&project_path)?;
    run_open(vec![path])
}

#[tauri::command]
pub fn open_in_cursor(project_path: String) -> Result<(), String> {
    let path = ensure_saved_project_path(&project_path)?;
    run_open_with_app("Cursor", path)
}

#[tauri::command]
pub fn open_in_xcode(project_path: String) -> Result<(), String> {
    let path = ensure_saved_project_path(&project_path)?;
    let target = find_first_with_extension(&path, "xcworkspace")
        .or_else(|| find_first_with_extension(&path, "xcodeproj"))
        .ok_or_else(|| {
            "This project does not contain an .xcworkspace or .xcodeproj file".to_string()
        })?;

    run_open_with_app("Xcode", target)
}

#[tauri::command]
pub fn open_in_terminal(project_path: String) -> Result<(), String> {
    let path = ensure_saved_project_path(&project_path)?;
    run_open_with_app("Terminal", path)
}

#[tauri::command]
pub async fn run_script(project_path: String, command: String) -> Result<ScriptResult, String> {
    let path = ensure_saved_project_path(&project_path)?;
    let command = command.trim().to_string();
    if command.is_empty() {
        return Err("Script command is empty".to_string());
    }
    if looks_dangerous(&command) {
        return Err("This command looks destructive and was blocked by DevDash".to_string());
    }
    ensure_configured_script(&project_path, &command)?;

    tauri::async_runtime::spawn_blocking(move || {
        let output = Command::new("/bin/zsh")
            .arg("-lc")
            .arg(command)
            .current_dir(path)
            .output()
            .map_err(|err| format!("Unable to run script: {err}"))?;

        Ok(ScriptResult {
            success: output.status.success(),
            code: output.status.code(),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        })
    })
    .await
    .map_err(|err| format!("Script worker failed: {err}"))?
}

fn validate_project_payload(project: &mut Project) -> Result<(), String> {
    if project.name.trim().is_empty() {
        return Err("Project name is required".to_string());
    }
    let path = validate_project_directory(&project.path)?;
    project.path = path
        .canonicalize()
        .unwrap_or(path)
        .to_string_lossy()
        .to_string();

    let allowed = ["idea", "active", "paused", "shipped", "archived"];
    if !allowed.contains(&project.status.as_str()) {
        return Err("Project status is invalid".to_string());
    }

    for script in &project.scripts {
        if script.name.trim().is_empty() || script.command.trim().is_empty() {
            return Err("Every script needs a name and command".to_string());
        }
        if looks_dangerous(&script.command) {
            return Err(format!(
                "Script '{}' looks destructive and was blocked",
                script.name
            ));
        }
    }

    Ok(())
}

fn validate_project_directory(project_path: &str) -> Result<PathBuf, String> {
    let path = scanner::validate_directory(project_path)?;
    let canonical_path = path.canonicalize().unwrap_or(path);
    reject_broad_directory(&canonical_path)?;
    Ok(canonical_path)
}

fn reject_broad_directory(path: &Path) -> Result<(), String> {
    let home = dirs::home_dir().map(|path| path.canonicalize().unwrap_or(path));
    let blocked = [
        PathBuf::from("/"),
        PathBuf::from("/Users"),
        PathBuf::from("/Applications"),
        PathBuf::from("/System"),
        PathBuf::from("/Library"),
        PathBuf::from("/private"),
    ];

    if blocked.iter().any(|blocked_path| blocked_path == path)
        || home.as_ref().is_some_and(|home| home == path)
    {
        return Err("This folder is too broad to add as a project. Please choose a specific project folder.".to_string());
    }

    Ok(())
}

fn ensure_saved_project_path(project_path: &str) -> Result<PathBuf, String> {
    let path = scanner::validate_directory(project_path)?;
    let canonical_path = path.canonicalize().unwrap_or(path);
    let store = storage::load_store()?;

    let exists = store.projects.iter().any(|project| {
        scanner::validate_directory(&project.path)
            .map(|saved_path| saved_path.canonicalize().unwrap_or(saved_path) == canonical_path)
            .unwrap_or(false)
    });

    if exists {
        Ok(canonical_path)
    } else {
        Err("This path is not saved in DevDash projects.json".to_string())
    }
}

fn ensure_configured_script(project_path: &str, command: &str) -> Result<(), String> {
    let requested_path = scanner::validate_directory(project_path)?;
    let requested_path = requested_path.canonicalize().unwrap_or(requested_path);
    let store = storage::load_store()?;

    let Some(project) = store.projects.iter().find(|project| {
        scanner::validate_directory(&project.path)
            .map(|saved_path| saved_path.canonicalize().unwrap_or(saved_path) == requested_path)
            .unwrap_or(false)
    }) else {
        return Err("Project was not found in DevDash".to_string());
    };

    if project
        .scripts
        .iter()
        .any(|script| script.command == command)
    {
        Ok(())
    } else {
        Err("This script is not configured on the saved project".to_string())
    }
}

fn run_open(paths: Vec<PathBuf>) -> Result<(), String> {
    let status = Command::new("open")
        .args(paths)
        .status()
        .map_err(|err| format!("Unable to run open: {err}"))?;

    if status.success() {
        Ok(())
    } else {
        Err("macOS open command failed".to_string())
    }
}

fn run_open_with_app(app: &str, path: PathBuf) -> Result<(), String> {
    let status = Command::new("open")
        .arg("-a")
        .arg(app)
        .arg(path)
        .status()
        .map_err(|err| format!("Unable to open with {app}: {err}"))?;

    if status.success() {
        Ok(())
    } else {
        Err(format!("Unable to open project with {app}"))
    }
}

fn find_first_with_extension(path: &Path, extension: &str) -> Option<PathBuf> {
    let mut matches: Vec<PathBuf> = fs::read_dir(path)
        .ok()?
        .flatten()
        .map(|entry| entry.path())
        .filter(|path| {
            path.extension()
                .and_then(|ext| ext.to_str())
                .map(|ext| ext.eq_ignore_ascii_case(extension))
                .unwrap_or(false)
        })
        .collect();
    matches.sort();
    matches.into_iter().next()
}

fn looks_dangerous(command: &str) -> bool {
    let compact = command.to_lowercase().replace('\n', " ");
    let blocked = [
        "rm -rf",
        "rm -fr",
        "sudo rm",
        "mkfs",
        "diskutil erase",
        "dd if=",
        ":(){",
        "> /dev/",
    ];

    blocked.iter().any(|needle| compact.contains(needle))
}
