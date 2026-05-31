const EXT_TO_LANG: Record<string, string> = {
  ts: "ts",
  tsx: "tsx",
  js: "js",
  jsx: "jsx",
  mjs: "js",
  cjs: "js",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  c: "c",
  h: "c",
  cpp: "cpp",
  hpp: "cpp",
  cc: "cpp",
  cs: "csharp",
  php: "php",
  md: "md",
  mdx: "mdx",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  ini: "ini",
  env: "shell",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  fish: "shell",
  sql: "sql",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  less: "css",
  vue: "vue",
  svelte: "svelte",
  prisma: "prisma",
  graphql: "graphql",
  gql: "graphql",
  proto: "proto",
  lua: "lua",
  zig: "zig",
  dart: "dart",
};

const FILENAME_TO_LANG: Record<string, string> = {
  dockerfile: "dockerfile",
  ".dockerignore": "shell",
  ".gitignore": "shell",
  ".env": "shell",
  makefile: "makefile",
};

const TEXT_LIKE = new Set([
  "txt",
  "license",
  "log",
  "1",
  "md",
]);

const BINARY_EXTS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "ico",
  "svg",
  "pdf",
  "zip",
  "tar",
  "gz",
  "tgz",
  "bz2",
  "xz",
  "7z",
  "exe",
  "dll",
  "so",
  "dylib",
  "bin",
  "wasm",
  "mp4",
  "mov",
  "avi",
  "webm",
  "mp3",
  "wav",
  "ogg",
  "flac",
  "ttf",
  "otf",
  "woff",
  "woff2",
  "eot",
  "psd",
  "ai",
  "sketch",
  "fig",
]);

export function detectLang(path: string): string {
  const lower = path.toLowerCase();
  const filename = lower.split("/").pop() ?? lower;
  if (FILENAME_TO_LANG[filename]) return FILENAME_TO_LANG[filename];
  if (filename.endsWith(".dockerfile") || filename.includes("dockerfile."))
    return "dockerfile";
  const ext = filename.includes(".") ? filename.split(".").pop()! : "";
  if (TEXT_LIKE.has(ext)) return "md";
  return EXT_TO_LANG[ext] ?? "text";
}

export function isBinary(path: string): boolean {
  const ext = path.toLowerCase().split(".").pop() ?? "";
  return BINARY_EXTS.has(ext);
}

/**
 * Map our internal lang IDs to Monaco's. Monaco mostly uses VS Code language
 * IDs; a few are different (e.g. "md" → "markdown", "ts" → "typescript").
 */
export function toMonacoLang(lang: string): string {
  switch (lang) {
    case "ts":
      return "typescript";
    case "tsx":
      return "typescript";
    case "js":
    case "mjs":
    case "cjs":
      return "javascript";
    case "jsx":
      return "javascript";
    case "md":
    case "mdx":
      return "markdown";
    case "python":
      return "python";
    case "go":
      return "go";
    case "rust":
      return "rust";
    case "java":
      return "java";
    case "json":
      return "json";
    case "yaml":
      return "yaml";
    case "sql":
      return "sql";
    case "shell":
      return "shell";
    case "dockerfile":
      return "dockerfile";
    case "html":
      return "html";
    case "css":
      return "css";
    case "scss":
      return "scss";
    case "toml":
      return "ini"; // Monaco doesn't have a real TOML grammar; ini renders OK
    case "graphql":
      return "graphql";
    case "vue":
      return "html";
    case "svelte":
      return "html";
    default:
      return "plaintext";
  }
}
