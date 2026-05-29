export function gitBranchLabel(gitInfo, { loading = false } = {}) {
  if (loading) return null;
  if (!gitInfo) return null;
  if (gitInfo.isGit === false) return '非 Git';
  return gitInfo.branch || 'detached';
}
