export type RepoRef = { owner: string; repo: string };

/**
 * Extract owner/repo from a GitHub URL. Returns null for user/org profile
 * URLs or non-GitHub URLs. Strips a trailing `.git` if present.
 */
export function parseGithubRepoUrl(url: string | undefined): RepoRef | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.host.endsWith("github.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null; // profile URL only
    return {
      owner: parts[0],
      repo: parts[1].replace(/\.git$/, ""),
    };
  } catch {
    return null;
  }
}

export function parseSelectId(selectId: string | undefined): RepoRef | null {
  if (!selectId) return null;
  const parts = selectId.split("/");
  if (parts.length !== 2) return null;
  return { owner: parts[0], repo: parts[1] };
}
