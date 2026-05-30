export const skills = {
  languages: ["JavaScript (ES6+)", "TypeScript", "Python", "Java", "C++"],
  frontend: [
    "React",
    "Next.js",
    "React Hooks",
    "Redux",
    "Tailwind CSS",
    "Responsive Design",
  ],
  backend: [
    "Node.js",
    "Express",
    "NestJS",
    "FastAPI",
    "REST",
    "GraphQL",
    "JWT",
    "Middleware",
  ],
  data: ["MongoDB", "PostgreSQL", "MySQL", "SQLite", "Vector search"],
  cloud: ["AWS", "Docker", "Docker Compose", "CI/CD", "GitHub Actions"],
  ai: [
    "Google Gemini",
    "RAG",
    "Agent orchestration",
    "OpenClaw",
    "LLM tool-use",
  ],
} as const;

export const achievements = [
  {
    title: "Amdocs GenAI Hackathon 2025 — 2nd of 11,000+",
    detail:
      "Built Serenity-AI, a personalized mental wellness companion powered by Gemini.",
  },
  {
    title: "AWS Certified Cloud Practitioner",
    detail: "Cloud computing fundamentals and AWS services.",
  },
] as const;

export const education = {
  school: "VIT Vellore",
  degree:
    "B.Tech in Computer Science Engineering, Specialization in Information Security",
  cgpa: "8.35",
  start: "2021",
  end: "2025",
} as const;
