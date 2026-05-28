use crate::{models::GitInfo, scanner};
use std::process::Command;

pub fn get_git_info(project_path: &str) -> Result<GitInfo, String> {
    let path = scanner::validate_directory(project_path)?;
    if !path.join(".git").exists() {
        return Ok(GitInfo {
            is_git: false,
            branch: None,
            has_changes: false,
            status: Vec::new(),
            commits: Vec::new(),
            error: Some("This project is not a Git repository".to_string()),
        });
    }

    let branch = run_git(project_path, &["branch", "--show-current"])
        .ok()
        .map(|output| output.trim().to_string())
        .filter(|output| !output.is_empty());

    let status_output = run_git(project_path, &["status", "--short"]).unwrap_or_default();
    let status: Vec<String> = status_output
        .lines()
        .map(|line| line.trim_end().to_string())
        .filter(|line| !line.trim().is_empty())
        .collect();

    let commits_output = run_git(project_path, &["log", "--oneline", "-5"]).unwrap_or_default();
    let commits: Vec<String> = commits_output
        .lines()
        .map(|line| line.trim_end().to_string())
        .filter(|line| !line.trim().is_empty())
        .collect();

    Ok(GitInfo {
        is_git: true,
        branch,
        has_changes: !status.is_empty(),
        status,
        commits,
        error: None,
    })
}

fn run_git(project_path: &str, args: &[&str]) -> Result<String, String> {
    let path = scanner::validate_directory(project_path)?;
    let output = Command::new("git")
        .arg("-C")
        .arg(path)
        .args(args)
        .output()
        .map_err(|err| format!("Unable to run git: {err}"))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        Err(if stderr.is_empty() {
            "Git command failed".to_string()
        } else {
            stderr
        })
    }
}
