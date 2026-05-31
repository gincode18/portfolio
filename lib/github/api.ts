import "server-only";

const GITHUB_API = "https://api.github.com";

function ghHeaders(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "vishal-os-portfolio",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export type GitHubTreeEntry = {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
};

export type RepoMeta = {
  owner: string;
  repo: string;
  defaultBranch: string;
  description: string | null;
  language: string | null;
  stars: number;
  htmlUrl: string;
};

export type RepoTree = {
  meta: RepoMeta;
  sha: string;
  truncated: boolean;
  entries: GitHubTreeEntry[];
};

export async function fetchRepoTree(
  owner: string,
  repo: string
): Promise<RepoTree> {
  // 1) repo metadata to discover default branch.
  const repoRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: ghHeaders(),
    next: { revalidate: 600 },
  });
  if (!repoRes.ok) {
    throw new Error(
      `GitHub repo ${owner}/${repo}: ${repoRes.status} ${repoRes.statusText}`
    );
  }
  const repoData = (await repoRes.json()) as {
    default_branch: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    html_url: string;
  };
  const defaultBranch = repoData.default_branch;

  // 2) Get the HEAD SHA on the default branch.
  const refRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(defaultBranch)}`,
    { headers: ghHeaders(), next: { revalidate: 300 } }
  );
  if (!refRes.ok) {
    throw new Error(`GitHub ref: ${refRes.status} ${refRes.statusText}`);
  }
  const refData = (await refRes.json()) as { object: { sha: string } };
  const sha = refData.object.sha;

  // 3) Recursive tree.
  const treeRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`,
    { headers: ghHeaders(), next: { revalidate: 600 } }
  );
  if (!treeRes.ok) {
    throw new Error(`GitHub tree: ${treeRes.status} ${treeRes.statusText}`);
  }
  const treeData = (await treeRes.json()) as {
    tree: GitHubTreeEntry[];
    truncated: boolean;
  };

  return {
    meta: {
      owner,
      repo,
      defaultBranch,
      description: repoData.description,
      language: repoData.language,
      stars: repoData.stargazers_count,
      htmlUrl: repoData.html_url,
    },
    sha,
    truncated: !!treeData.truncated,
    entries: treeData.tree.filter((e) => e.type === "blob" || e.type === "tree"),
  };
}

const MAX_FILE_BYTES = 350 * 1024; // 350KB cap on raw file content

export async function fetchRepoFile(
  owner: string,
  repo: string,
  path: string
): Promise<{ content: string; sha: string; size: number }> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodePath(path)}`,
    { headers: ghHeaders(), next: { revalidate: 600 } }
  );
  if (!res.ok) {
    throw new Error(
      `GitHub file ${path}: ${res.status} ${res.statusText}`
    );
  }
  const data = (await res.json()) as {
    content?: string;
    encoding?: string;
    size: number;
    sha: string;
  };

  if (!data.content || data.encoding !== "base64") {
    throw new Error(`Unsupported file response shape for ${path}`);
  }
  if (data.size > MAX_FILE_BYTES) {
    throw new Error(
      `File too large: ${(data.size / 1024).toFixed(0)} KB > ${(MAX_FILE_BYTES / 1024).toFixed(0)} KB cap`
    );
  }
  return {
    content: Buffer.from(data.content, "base64").toString("utf8"),
    sha: data.sha,
    size: data.size,
  };
}

function encodePath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
