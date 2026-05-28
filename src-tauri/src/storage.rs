use crate::models::{Project, ProjectStore};
use chrono::Utc;
use std::{fs, path::PathBuf};
use uuid::Uuid;

pub fn data_file_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or_else(|| "Unable to resolve the home directory".to_string())?;
    Ok(home.join(".devdash").join("projects.json"))
}

pub fn load_store() -> Result<ProjectStore, String> {
    let path = data_file_path()?;
    if !path.exists() {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|err| format!("Unable to create ~/.devdash: {err}"))?;
        }
        let store = ProjectStore::default();
        save_store(&store)?;
        return Ok(store);
    }

    let content = fs::read_to_string(&path)
        .map_err(|err| format!("Unable to read {}: {err}", path.display()))?;
    if content.trim().is_empty() {
        return Ok(ProjectStore::default());
    }

    serde_json::from_str(&content)
        .map_err(|err| format!("Unable to parse {}: {err}", path.display()))
}

pub fn save_store(store: &ProjectStore) -> Result<(), String> {
    let path = data_file_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|err| {
            format!("Unable to create data directory {}: {err}", parent.display())
        })?;
    }

    let content = serde_json::to_string_pretty(store)
        .map_err(|err| format!("Unable to serialize projects: {err}"))?;
    fs::write(&path, content).map_err(|err| format!("Unable to write {}: {err}", path.display()))
}

pub fn upsert_project(mut project: Project) -> Result<Project, String> {
    let mut store = load_store()?;
    let now = Utc::now().to_rfc3339();

    if project.id.trim().is_empty() {
        if let Some(existing) = store.projects.iter().find(|existing| same_path(&existing.path, &project.path)) {
            return Ok(existing.clone());
        }
    } else if store
        .projects
        .iter()
        .any(|existing| existing.id != project.id && same_path(&existing.path, &project.path))
    {
        return Err("A project with this path already exists in DevDash".to_string());
    }

    if project.id.trim().is_empty() {
        project.id = Uuid::new_v4().to_string();
    }
    if project.created_at.trim().is_empty() {
        project.created_at = now.clone();
    }
    project.updated_at = now.clone();
    if project.status != "archived" {
        project.archived_at = None;
    } else if project.archived_at.is_none() {
        project.archived_at = Some(now);
    }

    match store.projects.iter().position(|item| item.id == project.id) {
        Some(index) => store.projects[index] = project.clone(),
        None => store.projects.push(project.clone()),
    }

    save_store(&store)?;
    Ok(project)
}

fn same_path(left: &str, right: &str) -> bool {
    let left_path = std::path::PathBuf::from(left);
    let right_path = std::path::PathBuf::from(right);
    let left_path = left_path.canonicalize().unwrap_or(left_path);
    let right_path = right_path.canonicalize().unwrap_or(right_path);
    left_path == right_path
}

pub fn delete_record(project_id: &str) -> Result<(), String> {
    let mut store = load_store()?;
    let before = store.projects.len();
    store.projects.retain(|project| project.id != project_id);

    if store.projects.len() == before {
        return Err("Project record was not found".to_string());
    }

    save_store(&store)
}

pub fn archive_record(project_id: &str) -> Result<Project, String> {
    let mut store = load_store()?;
    let now = Utc::now().to_rfc3339();
    let project = store
        .projects
        .iter_mut()
        .find(|project| project.id == project_id)
        .ok_or_else(|| "Project record was not found".to_string())?;

    project.status = "archived".to_string();
    project.updated_at = now.clone();
    project.archived_at = Some(now);
    let archived = project.clone();
    save_store(&store)?;
    Ok(archived)
}
