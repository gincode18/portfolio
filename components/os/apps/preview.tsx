"use client";

const PDF_URL = "/resume.pdf";

export function PreviewApp() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5 text-xs">
        <span className="font-medium">resume.pdf</span>
        <div className="flex items-center gap-2">
          <a
            href={PDF_URL}
            download="Vishal_Resume.pdf"
            className="rounded border border-border px-2 py-1 hover:bg-foreground/5"
          >
            Download
          </a>
          <a
            href={PDF_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-border px-2 py-1 hover:bg-foreground/5"
          >
            Open
          </a>
        </div>
      </div>
      <object
        data={PDF_URL}
        type="application/pdf"
        className="h-full w-full bg-neutral-900"
        aria-label="Vishal's resume PDF"
      >
        <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
          <div>
            Your browser can&apos;t render PDFs inline.{" "}
            <a
              className="underline underline-offset-4"
              href={PDF_URL}
              target="_blank"
              rel="noreferrer"
            >
              Open resume.pdf in a new tab
            </a>
            .
          </div>
        </div>
      </object>
    </div>
  );
}
