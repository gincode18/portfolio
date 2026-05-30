"use client";

import { profile } from "@/content/profile";
import { education, skills, achievements } from "@/content/skills";

export function AboutApp() {
  return (
    <div className="h-full overflow-y-auto p-6 text-sm">
      <header className="mb-5">
        <div className="text-2xl font-semibold tracking-tight text-foreground">
          {profile.name}
        </div>
        <div className="text-muted-foreground">{profile.title}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {profile.location} · {profile.email}
        </div>
      </header>

      <p className="mb-6 leading-relaxed text-foreground/90">{profile.bio}</p>

      <Section title="Education">
        <div className="text-foreground/90">{education.degree}</div>
        <div className="text-muted-foreground">
          {education.school} · CGPA {education.cgpa} · {education.start}–
          {education.end}
        </div>
      </Section>

      <Section title="Achievements">
        <ul className="space-y-1.5">
          {achievements.map((a) => (
            <li key={a.title}>
              <div className="text-foreground/90">{a.title}</div>
              <div className="text-muted-foreground">{a.detail}</div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Stack">
        <SkillRow label="Languages" items={skills.languages} />
        <SkillRow label="Frontend" items={skills.frontend} />
        <SkillRow label="Backend" items={skills.backend} />
        <SkillRow label="Data" items={skills.data} />
        <SkillRow label="Cloud" items={skills.cloud} />
        <SkillRow label="AI" items={skills.ai} />
      </Section>

      <footer className="mt-6 flex gap-4 text-xs">
        <a
          href={profile.links.github}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 hover:underline"
        >
          GitHub
        </a>
        <a
          href={profile.links.linkedin}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 hover:underline"
        >
          LinkedIn
        </a>
        <a
          href={`mailto:${profile.email}`}
          className="underline-offset-4 hover:underline"
        >
          Email
        </a>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function SkillRow({ label, items }: { label: string; items: readonly string[] }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span className="text-foreground/90">{items.join(" · ")}</span>
    </div>
  );
}
