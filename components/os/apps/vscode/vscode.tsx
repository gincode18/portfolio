"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useAppSelection } from "@/lib/store/windows";
import { parseSelectId, type RepoRef } from "@/lib/github/parse";
import { projects } from "@/content/projects";
import { parseGithubRepoUrl } from "@/lib/github/parse";
import type { RepoTree } from "@/lib/github/api";
import { buildTree, type TreeNode } from "./tree-builder";
import { FileIcon, FolderIcon } from "@/lib/icons/file-icons";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center text-sm text-neutral-500">
        Loading editor…
      </div>
    ),
  }
);

type FileState =
  | { status: "idle" }
  | { status: "loading"; path: string }
  | {
      status: "ok";
      path: string;
      content: string;
      lang: string;
      monacoLang: string;
      lines: number;
      binary: boolean;
    }
  | { status: "error"; path: string; message: string };

type TreeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; data: RepoTree }
  | { status: "error"; message: string };

export function VSCodeApp() {
  const selectId = useAppSelection("vscode");

  const knownRepos = useMemo<RepoRef[]>(() => {
    return projects
      .map((p) => parseGithubRepoUrl(p.links.github))
      .filter((r): r is RepoRef => r !== null);
  }, []);

  const [repo, setRepo] = useState<RepoRef | null>(() => {
    return parseSelectId(selectId) ?? knownRepos[0] ?? null;
  });
  const [tree, setTree] = useState<TreeState>({ status: "idle" });
  const [file, setFile] = useState<FileState>({ status: "idle" });

  useEffect(() => {
    const parsed = parseSelectId(selectId);
    if (parsed) setRepo(parsed);
  }, [selectId]);

  useEffect(() => {
    if (!repo) return;
    let cancelled = false;
    setTree({ status: "loading" });
    setFile({ status: "idle" });
    fetch(
      `/api/github/tree?owner=${encodeURIComponent(repo.owner)}&repo=${encodeURIComponent(repo.repo)}`
    )
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setTree({ status: "error", message: data.error ?? `HTTP ${res.status}` });
          return;
        }
        setTree({ status: "ok", data });

        const readme = (data as RepoTree).entries.find((e) =>
          /^readme(\.md|\.mdx|\.txt)?$/i.test(e.path)
        );
        if (readme) openFile(repo, readme.path);
      })
      .catch((err) => {
        if (cancelled) return;
        setTree({ status: "error", message: (err as Error).message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo?.owner, repo?.repo]);

  async function openFile(r: RepoRef, path: string) {
    setFile({ status: "loading", path });
    try {
      const res = await fetch(
        `/api/github/file?owner=${encodeURIComponent(r.owner)}&repo=${encodeURIComponent(r.repo)}&path=${encodeURIComponent(path)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setFile({ status: "error", path, message: data.error ?? `HTTP ${res.status}` });
        return;
      }
      setFile({
        status: "ok",
        path,
        content: data.content,
        lang: data.lang,
        monacoLang: data.monacoLang ?? "plaintext",
        lines: data.lines,
        binary: !!data.binary,
      });
    } catch (err) {
      setFile({ status: "error", path, message: (err as Error).message });
    }
  }

  return (
    <div className="grid h-full grid-cols-[44px_240px_1fr] bg-neutral-50 text-[12.5px] text-neutral-800 dark:bg-[#1e1e1e] dark:text-neutral-200">
      <ActivityBar />
      <Sidebar
        repo={repo}
        knownRepos={knownRepos}
        onRepoChange={setRepo}
        tree={tree}
        activePath={file.status !== "idle" ? file.path : undefined}
        onOpenFile={(path) => repo && openFile(repo, path)}
      />
      <Editor file={file} repo={repo} />
    </div>
  );
}

function ActivityBar() {
  return (
    <div className="flex flex-col items-center gap-3 border-r border-neutral-200 bg-neutral-100 py-3 dark:border-black dark:bg-[#181818]">
      <ActivityIcon active label="Explorer">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" />
        </svg>
      </ActivityIcon>
      <ActivityIcon label="Search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.7" y2="16.7" />
        </svg>
      </ActivityIcon>
      <ActivityIcon label="Source Control">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="6" cy="6" r="2.4" />
          <circle cx="6" cy="18" r="2.4" />
          <circle cx="18" cy="12" r="2.4" />
          <path d="M6 8.4V15.6" />
          <path d="M8.4 6h6.6a2.4 2.4 0 0 1 2.4 2.4V9.6" />
        </svg>
      </ActivityIcon>
    </div>
  );
}

function ActivityIcon({
  active,
  label,
  children,
}: {
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      className={cn(
        "relative grid h-9 w-9 place-items-center rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white",
        active && "text-neutral-900 dark:text-white"
      )}
    >
      {active && (
        <span className="absolute left-0 h-5 w-0.5 rounded-r-full bg-neutral-900 dark:bg-white" />
      )}
      {children}
    </button>
  );
}

function Sidebar({
  repo,
  knownRepos,
  onRepoChange,
  tree,
  activePath,
  onOpenFile,
}: {
  repo: RepoRef | null;
  knownRepos: RepoRef[];
  onRepoChange: (r: RepoRef) => void;
  tree: TreeState;
  activePath?: string;
  onOpenFile: (path: string) => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden border-r border-neutral-200 bg-neutral-50 dark:border-black dark:bg-[#1e1e1e]">
      <div className="flex shrink-0 items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        Explorer
      </div>

      {knownRepos.length > 1 && (
        <RepoSwitcher
          repos={knownRepos}
          current={repo}
          onChange={onRepoChange}
        />
      )}

      <div className="flex-1 overflow-y-auto pb-3">
        {tree.status === "loading" && <Status text="Loading repo…" />}
        {tree.status === "error" && (
          <Status text={`error: ${tree.message}`} kind="error" />
        )}
        {tree.status === "ok" && (
          <>
            <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              <Chevron expanded />
              <FolderIcon size={12} className="text-amber-500" />
              <span>
                {tree.data.meta.owner}/{tree.data.meta.repo}
              </span>
            </div>
            <Tree
              nodes={buildTree(tree.data.entries)}
              depth={0}
              activePath={activePath}
              onOpenFile={onOpenFile}
            />
            {tree.data.truncated && (
              <div className="px-3 pt-2 text-[10px] italic text-neutral-500">
                tree truncated by GitHub (very large repo)
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RepoSwitcher({
  repos,
  current,
  onChange,
}: {
  repos: RepoRef[];
  current: RepoRef | null;
  onChange: (r: RepoRef) => void;
}) {
  const value = current ? `${current.owner}/${current.repo}` : "";
  return (
    <div className="shrink-0 border-b border-neutral-200 px-3 py-2 dark:border-black">
      <select
        value={value}
        onChange={(e) => {
          const r = repos.find((r) => `${r.owner}/${r.repo}` === e.target.value);
          if (r) onChange(r);
        }}
        className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-[11px] outline-hidden dark:border-neutral-700 dark:bg-[#252526]"
      >
        {repos.map((r) => (
          <option key={`${r.owner}/${r.repo}`} value={`${r.owner}/${r.repo}`}>
            {r.owner}/{r.repo}
          </option>
        ))}
      </select>
    </div>
  );
}

function Tree({
  nodes,
  depth,
  activePath,
  onOpenFile,
}: {
  nodes: TreeNode[];
  depth: number;
  activePath?: string;
  onOpenFile: (path: string) => void;
}) {
  return (
    <ul>
      {nodes.map((node) => (
        <TreeRow
          key={node.path}
          node={node}
          depth={depth}
          activePath={activePath}
          onOpenFile={onOpenFile}
        />
      ))}
    </ul>
  );
}

function TreeRow({
  node,
  depth,
  activePath,
  onOpenFile,
}: {
  node: TreeNode;
  depth: number;
  activePath?: string;
  onOpenFile: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);

  if (node.kind === "dir") {
    return (
      <li>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ paddingLeft: 8 + depth * 12 }}
          className="flex w-full items-center gap-1.5 py-0.5 pr-3 text-left text-neutral-700 hover:bg-neutral-200/50 dark:text-neutral-300 dark:hover:bg-[#2a2a2a]"
        >
          <Chevron expanded={expanded} />
          <FolderIcon size={12} className="text-amber-500" />
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && node.children && (
          <Tree
            nodes={node.children}
            depth={depth + 1}
            activePath={activePath}
            onOpenFile={onOpenFile}
          />
        )}
      </li>
    );
  }

  const active = node.path === activePath;
  return (
    <li>
      <button
        onClick={() => onOpenFile(node.path)}
        style={{ paddingLeft: 8 + depth * 12 + 14 }}
        className={cn(
          "flex w-full items-center gap-1.5 py-0.5 pr-3 text-left",
          active
            ? "bg-sky-200/70 text-neutral-900 dark:bg-[#37373d] dark:text-white"
            : "hover:bg-neutral-200/50 dark:hover:bg-[#2a2a2a]"
        )}
      >
        <FileIcon path={node.path} size={13} />
        <span className="truncate">{node.name}</span>
      </button>
    </li>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("shrink-0 transition-transform", expanded ? "" : "-rotate-90")}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Status({ text, kind = "info" }: { text: string; kind?: "info" | "error" }) {
  return (
    <div
      className={cn(
        "px-3 py-4 text-[11px]",
        kind === "error" ? "text-rose-600 dark:text-rose-400" : "text-neutral-500"
      )}
    >
      {text}
    </div>
  );
}

function Editor({ file, repo }: { file: FileState; repo: RepoRef | null }) {
  const { resolvedTheme } = useTheme();
  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "vs";

  return (
    <div className="flex flex-col overflow-hidden">
      <TabBar file={file} repo={repo} />
      <div className="flex-1 overflow-hidden">
        {file.status === "idle" && <EmptyEditor repo={repo} />}
        {file.status === "loading" && (
          <div className="grid h-full place-items-center text-sm text-neutral-500">
            Loading {file.path}…
          </div>
        )}
        {file.status === "error" && (
          <div className="grid h-full place-items-center px-6 text-center text-sm text-rose-600 dark:text-rose-400">
            {file.message}
          </div>
        )}
        {file.status === "ok" && (
          <MonacoEditor
            key={`${file.path}-${monacoTheme}`}
            height="100%"
            theme={monacoTheme}
            language={file.monacoLang}
            value={file.content}
            options={{
              readOnly: true,
              minimap: { enabled: true, scale: 1 },
              fontSize: 12.5,
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              lineNumbers: "on",
              renderLineHighlight: "all",
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: "smooth",
              automaticLayout: true,
              wordWrap: "off",
              padding: { top: 8, bottom: 8 },
            }}
          />
        )}
      </div>
      <StatusBar file={file} repo={repo} />
    </div>
  );
}

function EmptyEditor({ repo }: { repo: RepoRef | null }) {
  return (
    <div className="grid h-full place-items-center px-6 text-center text-sm text-neutral-500">
      <div>
        {repo ? (
          <>
            <div>
              Loaded <span className="font-mono">{repo.owner}/{repo.repo}</span>.
            </div>
            <div className="mt-1 text-xs">Pick a file from the Explorer to view it.</div>
          </>
        ) : (
          <>No repo selected. Open a project from the Projects app.</>
        )}
      </div>
    </div>
  );
}

function TabBar({ file, repo }: { file: FileState; repo: RepoRef | null }) {
  const displayPath =
    file.status === "ok" || file.status === "loading" || file.status === "error"
      ? file.path
      : "";

  return (
    <div className="flex shrink-0 items-stretch border-b border-neutral-200 bg-neutral-100 dark:border-black dark:bg-[#252526]">
      {displayPath ? (
        <div className="flex items-center gap-2 border-r border-neutral-200 bg-white px-3 py-1.5 text-[12px] text-neutral-900 dark:border-black dark:bg-[#1e1e1e] dark:text-white">
          <FileIcon path={displayPath} size={13} />
          <span>{displayPath.split("/").pop()}</span>
        </div>
      ) : (
        <div className="px-3 py-1.5 text-[12px] text-neutral-500">No file open</div>
      )}
      <div className="flex flex-1 items-center justify-end px-3 text-[10px] text-neutral-500">
        {repo && (
          <a
            href={`https://github.com/${repo.owner}/${repo.repo}`}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            view on github →
          </a>
        )}
      </div>
    </div>
  );
}

function StatusBar({ file, repo }: { file: FileState; repo: RepoRef | null }) {
  const lang = file.status === "ok" ? labelForLang(file.lang) : "—";
  const lines = file.status === "ok" ? `${file.lines} lines` : "";

  return (
    <div className="flex shrink-0 items-center justify-between border-t border-neutral-200 bg-sky-700 px-3 py-1 text-[11px] text-white dark:border-black dark:bg-[#007acc]">
      <div className="flex items-center gap-3">
        <span>{repo ? `${repo.owner}/${repo.repo}` : "Vishal OS"}</span>
        <span>main</span>
      </div>
      <div className="flex items-center gap-3">
        {lines && <span>{lines}</span>}
        <span>UTF-8</span>
        <span>{lang}</span>
      </div>
    </div>
  );
}

function labelForLang(lang: string): string {
  switch (lang) {
    case "ts":
      return "TypeScript";
    case "tsx":
      return "TypeScript JSX";
    case "js":
      return "JavaScript";
    case "jsx":
      return "JavaScript JSX";
    case "md":
      return "Markdown";
    case "mdx":
      return "MDX";
    case "json":
      return "JSON";
    case "yaml":
      return "YAML";
    case "sql":
      return "SQL";
    case "dockerfile":
      return "Docker";
    case "python":
      return "Python";
    case "binary":
      return "Binary";
    case "text":
      return "Plain text";
    default:
      return lang;
  }
}
