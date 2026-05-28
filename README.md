# ProjectDashboard / DevDash

DevDash is a macOS-first local project dashboard built with Tauri 2, React, Vite, and Rust commands. It keeps project metadata outside your repositories at:

```txt
~/.devdash/projects.json
```

No backend server, cloud database, account system, telemetry, or repository pollution is used.

## Run

```bash
npm install
npm run tauri dev
```

## First Version Scope

- Add a project manually with name, path, description, status, tags, progress, next steps, and custom scripts.
- Drag a folder into the app, or choose a folder, to add it directly as a project.
- Folder-based adding only saves the path and default metadata. It does not detect tags, generate scripts, run commands, or modify the project directory.
- Browse projects by search, status, and tag.
- Read and render README content with Markdown.
- Show Git branch, working tree status, and the latest five commits.
- Open a project in Finder, Cursor, Xcode, or Terminal through Rust commands.
- Run configured scripts in the project working directory and show stdout/stderr after completion.
- Archive a project, remove its DevDash record, or show the delete-local-files warning without deleting files.

## Safety Notes

- Open operations validate that the target path exists and is a directory.
- Adding projects rejects broad system/user roots such as `/`, `/Users`, `/Applications`, and your home directory.
- Duplicate paths are not added twice; DevDash returns the existing project record.
- Git and open operations use `std::process::Command` with arguments instead of shell string concatenation.
- Script execution uses `/bin/zsh -lc` because scripts are user-defined. DevDash blocks several obvious destructive command patterns, but you should only run commands you configured and trust.
- This version does not implement `rm -rf` or direct local project deletion.

## Data Shape

```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "DevDash",
      "path": "/Users/you/Projects/devdash",
      "description": "Local project dashboard",
      "status": "active",
      "tags": ["macOS", "Tauri", "React"],
      "progress": "基础功能已完成",
      "nextSteps": "继续打磨项目扫描和脚本输出",
      "scripts": [
        {
          "name": "Dev",
          "command": "npm run tauri dev"
        }
      ],
      "createdAt": "2026-05-28T00:00:00Z",
      "updatedAt": "2026-05-28T00:00:00Z",
      "archivedAt": null
    }
  ]
}
```
