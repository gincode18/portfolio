"use client";

import { useActionState } from "react";
import { sendContactMessage, type ContactState } from "@/app/actions/contact";
import { profile } from "@/content/profile";

const INITIAL: ContactState = { status: "idle" };

export function MailApp() {
  const [state, formAction, pending] = useActionState(
    sendContactMessage,
    INITIAL
  );

  if (state.status === "ok") {
    return <SentState />;
  }

  return (
    <div className="grid h-full grid-cols-[180px_1fr] text-sm">
      <Sidebar />

      <form
        action={formAction}
        className="flex h-full flex-col overflow-y-auto"
      >
        <Header />

        <div className="flex flex-col gap-4 px-5 py-4">
          <Field
            label="From"
            error={
              state.status === "error" ? state.fieldErrors?.name : undefined
            }
          >
            <input
              name="name"
              required
              maxLength={100}
              placeholder="Your name"
              autoComplete="name"
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-hidden focus:border-foreground"
            />
          </Field>

          <Field
            label="Reply-to"
            error={
              state.status === "error" ? state.fieldErrors?.email : undefined
            }
          >
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-hidden focus:border-foreground"
            />
          </Field>

          <Field
            label="Message"
            error={
              state.status === "error" ? state.fieldErrors?.message : undefined
            }
          >
            <textarea
              name="message"
              required
              maxLength={2000}
              rows={8}
              placeholder="What's on your mind?"
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 outline-hidden focus:border-foreground"
            />
          </Field>

          {state.status === "error" && !state.fieldErrors && (
            <div className="rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">
              {state.message}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-muted-foreground">
              Goes to{" "}
              <span className="font-medium text-foreground">
                {profile.email}
              </span>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-foreground px-4 py-1.5 text-sm font-medium text-background transition disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="border-r border-border bg-muted/30 p-2 text-sm">
      <div className="px-2 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Folders
      </div>
      <ul className="space-y-0.5">
        <li>
          <div className="flex items-center justify-between rounded px-2 py-1.5 bg-foreground/10 text-foreground">
            <span className="font-medium">New Message</span>
          </div>
        </li>
        <li>
          <div className="rounded px-2 py-1.5 text-muted-foreground">Sent</div>
        </li>
        <li>
          <div className="rounded px-2 py-1.5 text-muted-foreground">Drafts</div>
        </li>
      </ul>

      <div className="mt-6 px-2 text-xs leading-relaxed text-muted-foreground">
        Messages land in Vishal&apos;s inbox and are saved to a local audit log
        on the Raspberry Pi running this site.
      </div>
    </aside>
  );
}

function Header() {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
      <div>
        <div className="text-base font-semibold">New Message</div>
        <div className="text-xs text-muted-foreground">
          To: {profile.name} &lt;{profile.email}&gt;
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {error && (
          <span className="text-[11px] text-rose-600 dark:text-rose-400">
            {error}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

function SentState() {
  return (
    <div className="grid h-full place-items-center p-8 text-center">
      <div className="max-w-xs">
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 mx-auto dark:text-emerald-300">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="text-lg font-semibold">Message sent</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Thanks — Vishal will reply from {profile.email}.
        </div>
      </div>
    </div>
  );
}
