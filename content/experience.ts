export type Experience = {
  id: string;
  company: string;
  role: string;
  location: string;
  start: string;
  end: string | "Present";
  highlights: string[];
  stack: string[];
};

export const experience: Experience[] = [
  {
    id: "pwc",
    company: "PricewaterhouseCoopers (PwC)",
    role: "Associate Software Engineer",
    location: "Gurugram, India",
    start: "Apr 2026",
    end: "Present",
    highlights: [
      "Developing AI-powered agents for financial services that automate workflows for enterprise CFO solutions.",
      "Building backend services with Python and FastAPI, enabling scalable APIs for AI-driven applications.",
      "Designing and integrating REST APIs with React + TypeScript frontends for end-to-end financial workflows.",
    ],
    stack: ["Python", "FastAPI", "React", "TypeScript", "AI Agents"],
  },
  {
    id: "markopolo-fulltime",
    company: "Markopolo AI Inc.",
    role: "Full-Stack Developer",
    location: "San Francisco, CA (Remote)",
    start: "Aug 2025",
    end: "Mar 2026",
    highlights: [
      "Architected 15+ full-stack features serving 1000+ daily platform users.",
      "Built a custom Shopify app using the Web Pixel API to capture e-commerce events for 500+ merchant stores.",
      "Integrated HubSpot Marketing + CRM REST APIs for 50+ enterprise clients with seamless data sync.",
      "Reduced manual marketing-campaign setup time by 60% via HubSpot workflow automation.",
    ],
    stack: [
      "React",
      "Node.js",
      "NestJS",
      "Express",
      "MongoDB",
      "PostgreSQL",
      "TypeScript",
      "Shopify",
      "HubSpot",
    ],
  },
  {
    id: "markopolo-intern",
    company: "Markopolo AI Inc.",
    role: "Software Engineering Intern",
    location: "San Francisco, CA (Remote)",
    start: "Feb 2025",
    end: "Aug 2025",
    highlights: [
      "Built responsive React dashboards that improved user engagement metrics by 25%.",
      "Developed REST APIs in Node.js + Express handling 500+ daily requests at 99% uptime.",
    ],
    stack: ["React", "React Hooks", "Context API", "Node.js", "Express"],
  },
];
