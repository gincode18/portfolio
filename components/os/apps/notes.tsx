"use client";

import { useEffect, useState } from "react";
import { notes, type Note } from "@/content/notes";
import { useAppSelection } from "@/lib/store/windows";

export function NotesApp() {
  const externalSelect = useAppSelection("notes");
  const [selectedId, setSelectedId] = useState<string>(
    externalSelect ?? notes[0].id
  );

  useEffect(() => {
    if (externalSelect) setSelectedId(externalSelect);
  }, [externalSelect]);

  const selected = notes.find((n) => n.id === selectedId) ?? notes[0];

  return (
    <div className="grid h-full grid-cols-[220px_1fr] text-sm">
      <aside className="overflow-y-auto border-r border-border/60 bg-muted/30 p-2">
        <ul className="space-y-0.5">
          {notes.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => setSelectedId(n.id)}
                className={`w-full rounded px-2 py-1.5 text-left ${
                  n.id === selectedId
                    ? "bg-foreground/10 text-foreground"
                    : "text-foreground/80 hover:bg-foreground/5"
                }`}
              >
                <div className="font-medium leading-tight">{n.title}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {n.publishedAt} · {n.tags.join(" · ")}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <NoteBody note={selected} />
    </div>
  );
}

function NoteBody({ note }: { note: Note }) {
  return (
    <article className="overflow-y-auto p-6">
      <header className="mb-4">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {note.publishedAt} · {note.tags.join(" · ")}
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {note.title}
        </h1>
        <p className="mt-1 text-muted-foreground">{note.summary}</p>
      </header>
      <Markdown text={note.body} />
    </article>
  );
}

/**
 * Tiny markdown renderer for our hand-authored note bodies. Supports headings,
 * paragraphs, bullet lists, inline code, and bold. Deliberately small — we
 * control the content, so we don't need a general-purpose parser.
 */
function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let paraBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={`l-${blocks.length}`} className="my-3 list-disc space-y-1 pl-5">
        {listBuffer.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  const flushPara = () => {
    if (paraBuffer.length === 0) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="my-3 leading-relaxed">
        {inline(paraBuffer.join(" "))}
      </p>
    );
    paraBuffer = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      flushPara();
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      flushPara();
      blocks.push(
        <h2 key={`h1-${blocks.length}`} className="mt-6 mb-2 text-xl font-semibold">
          {line.slice(2)}
        </h2>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      flushPara();
      blocks.push(
        <h3 key={`h2-${blocks.length}`} className="mt-5 mb-1.5 text-base font-semibold">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith("- ")) {
      flushPara();
      listBuffer.push(line.slice(2));
    } else {
      flushList();
      paraBuffer.push(line);
    }
  }
  flushList();
  flushPara();

  return <div className="text-foreground/90">{blocks}</div>;
}

function inline(s: string): React.ReactNode {
  // Split on `code` and **bold** segments while preserving order.
  const parts: React.ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-foreground/10 px-1 py-px font-mono text-[12px]"
        >
          {tok.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(
        <strong key={key++} className="font-semibold">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    last = m.index + tok.length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}
