import type { ReactNode } from "react";
import {
  TypeScriptIcon,
  JavaScriptIcon,
  PythonIcon,
  GoIcon,
  RustIcon,
  JavaIcon,
  MarkdownIcon,
  JsonIcon,
  YamlIcon,
  Html5Icon,
  CssIcon,
  DockerIcon,
  GitIcon,
  NpmIcon,
  BashIcon,
  SqlIcon,
  ReactIcon,
  NextJsIcon,
} from "./brands";

type Props = { size?: number; className?: string };

/**
 * Render the right file-type icon for a given path. Falls back to a generic
 * grey document glyph for unknown types.
 *
 * Recognition order:
 *  1. Whole filenames (e.g. `package.json`, `Dockerfile`, `.gitignore`)
 *  2. Multi-character suffix patterns (`next.config.*`)
 *  3. Extension lookup
 */
export function FileIcon({
  path,
  size = 14,
  className,
}: Props & { path: string }): ReactNode {
  const lower = path.toLowerCase();
  const filename = lower.split("/").pop() ?? lower;
  const ext = filename.includes(".") ? filename.split(".").pop()! : "";

  // Exact filename matches.
  if (filename === "package.json" || filename === "package-lock.json") {
    return <NpmIcon size={size} className={className} />;
  }
  if (
    filename === ".gitignore" ||
    filename === ".gitattributes" ||
    filename === ".gitmodules"
  ) {
    return <GitIcon size={size} className={className} />;
  }
  if (filename === "dockerfile" || filename.endsWith(".dockerfile")) {
    return <DockerIcon size={size} className={className} />;
  }
  if (
    filename === "next.config.js" ||
    filename === "next.config.ts" ||
    filename === "next.config.mjs"
  ) {
    return <NextJsIcon size={size} className={className} />;
  }
  if (filename === "tsconfig.json") {
    return <TypeScriptIcon size={size} className={className} />;
  }

  // Extension matches.
  switch (ext) {
    case "ts":
      return <TypeScriptIcon size={size} className={className} />;
    case "tsx":
      return <ReactIcon size={size} className={className} />;
    case "js":
    case "mjs":
    case "cjs":
      return <JavaScriptIcon size={size} className={className} />;
    case "jsx":
      return <ReactIcon size={size} className={className} />;
    case "py":
      return <PythonIcon size={size} className={className} />;
    case "go":
      return <GoIcon size={size} className={className} />;
    case "rs":
      return <RustIcon size={size} className={className} />;
    case "java":
    case "kt":
      return <JavaIcon size={size} className={className} />;
    case "md":
    case "mdx":
      return <MarkdownIcon size={size} className={className} />;
    case "json":
    case "jsonc":
      return <JsonIcon size={size} className={className} />;
    case "yml":
    case "yaml":
      return <YamlIcon size={size} className={className} />;
    case "html":
    case "htm":
      return <Html5Icon size={size} className={className} />;
    case "css":
    case "scss":
    case "less":
      return <CssIcon size={size} className={className} />;
    case "sql":
      return <SqlIcon size={size} className={className} />;
    case "sh":
    case "bash":
    case "zsh":
    case "fish":
      return <BashIcon size={size} className={className} />;
    default:
      return <GenericFileIcon size={size} className={className} />;
  }
}

export function GenericFileIcon({ size = 14, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function FolderIcon({ size = 14, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" />
    </svg>
  );
}
