use crate::models::ScannedProject;
use serde_json::Value;
use std::{
    collections::BTreeSet,
    fs,
    path::{Path, PathBuf},
};

pub fn expand_tilde(input: &str) -> Result<PathBuf, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Path is empty".to_string());
    }

    if trimmed == "~" {
        return dirs::home_dir().ok_or_else(|| "Unable to resolve the home directory".to_string());
    }

    if let Some(rest) = trimmed.strip_prefix("~/") {
        let home =
            dirs::home_dir().ok_or_else(|| "Unable to resolve the home directory".to_string())?;
        return Ok(home.join(rest));
    }

    Ok(PathBuf::from(trimmed))
}

pub fn validate_directory(input: &str) -> Result<PathBuf, String> {
    let path = expand_tilde(input)?;
    if !path.exists() {
        return Err(format!("Path does not exist: {}", path.display()));
    }
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", path.display()));
    }
    Ok(path)
}

pub fn scan_directory(path: &str) -> Result<Vec<ScannedProject>, String> {
    let root = validate_directory(path)?;
    let entries = fs::read_dir(&root)
        .map_err(|err| format!("Unable to read directory {}: {err}", root.display()))?;
    let mut projects = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|err| format!("Unable to read a directory entry: {err}"))?;
        let path = entry.path();
        if !path.is_dir() || is_hidden_dir(&path) {
            continue;
        }

        let tags = detect_tags(&path);
        if tags.is_empty() {
            continue;
        }

        let (name, description) = read_package_metadata(&path).unwrap_or_else(|| {
            let name = path
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("Untitled Project")
                .to_string();
            (name, String::new())
        });

        projects.push(ScannedProject {
            name,
            path: path.to_string_lossy().to_string(),
            description,
            status: "active".to_string(),
            tags,
        });
    }

    projects.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(projects)
}

fn is_hidden_dir(path: &Path) -> bool {
    path.file_name()
        .and_then(|name| name.to_str())
        .map(|name| name.starts_with('.'))
        .unwrap_or(false)
}

fn detect_tags(path: &Path) -> Vec<String> {
    let mut tags = BTreeSet::new();

    if path.join(".git").exists() {
        tags.insert("Git".to_string());
    }
    if path.join("package.json").exists() {
        tags.insert("JavaScript".to_string());
        tags.insert("Node".to_string());
        if package_has_react(path) {
            tags.insert("React".to_string());
        }
    }
    if path.join("src-tauri").exists() {
        tags.insert("Tauri".to_string());
    }
    if path.join("Cargo.toml").exists() {
        tags.insert("Rust".to_string());
    }
    if path.join("Podfile").exists() {
        tags.insert("CocoaPods".to_string());
        tags.insert("iOS".to_string());
    }
    if has_extension(path, "xcodeproj") {
        tags.insert("Xcode".to_string());
        tags.insert("iOS".to_string());
    }
    if has_extension(path, "xcworkspace") {
        tags.insert("Xcode Workspace".to_string());
    }
    if ["README.md", "readme.md", "README"]
        .iter()
        .any(|name| path.join(name).exists())
    {
        tags.insert("Docs".to_string());
    }

    tags.into_iter().collect()
}

fn package_has_react(path: &Path) -> bool {
    let Ok(content) = fs::read_to_string(path.join("package.json")) else {
        return false;
    };
    let Ok(value) = serde_json::from_str::<Value>(&content) else {
        return false;
    };

    ["dependencies", "devDependencies"].iter().any(|key| {
        value
            .get(key)
            .and_then(|deps| deps.as_object())
            .map(|deps| deps.contains_key("react"))
            .unwrap_or(false)
    })
}

fn has_extension(path: &Path, extension: &str) -> bool {
    let Ok(entries) = fs::read_dir(path) else {
        return false;
    };

    entries.flatten().any(|entry| {
        entry
            .path()
            .extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| ext.eq_ignore_ascii_case(extension))
            .unwrap_or(false)
    })
}

fn read_package_metadata(path: &Path) -> Option<(String, String)> {
    let content = fs::read_to_string(path.join("package.json")).ok()?;
    let value = serde_json::from_str::<Value>(&content).ok()?;
    let fallback = path.file_name()?.to_str()?.to_string();
    let name = value
        .get("name")
        .and_then(|name| name.as_str())
        .filter(|name| !name.trim().is_empty())
        .unwrap_or(&fallback)
        .to_string();
    let description = value
        .get("description")
        .and_then(|description| description.as_str())
        .unwrap_or("")
        .to_string();

    Some((name, description))
}
