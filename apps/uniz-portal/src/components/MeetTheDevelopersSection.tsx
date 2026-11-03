import { ArrowUpRight, Building2 } from "lucide-react";
import { DEVELOPER_TESTIMONIALS } from "@/constants/developerTestimonials";

const ENGINEER_ROLES: Record<
  string,
  {
    formalTitle: string;
    department: string;
    responsibilities: string;
    systems: string[];
  }
> = {
  "Sree Charan": {
    formalTitle: "Lead Systems Architect & Backend Engineering",
    department: "Distributed Systems, Infrastructure & Core APIs",
    responsibilities:
      "Architected the UniZ microservice topology, Kubernetes (K3s) production cluster, examination grading pipelines, and cross-platform Android/iOS delivery infrastructure.",
    systems: [
      "Microservices & API Gateway",
      "K3s Cluster & CI/CD Automation",
      "Academic & Examination Engine",
    ],
  },
  "Bhanu Prakash": {
    formalTitle: "Lead Frontend Architect & Interface Engineering",
    department: "Institutional Web Portal & Design Systems",
    responsibilities:
      "Designed and engineered the unified student, faculty, and administrative web interfaces, responsive data tables, and institutional typographic system.",
    systems: [
      "Student & Faculty Web Portals",
      "Course Registration & Transcripts UI",
      "Responsive Institutional Design System",
    ],
  },
  Anand: {
    formalTitle: "Backend Services & Data Systems Engineer",
    department: "Database Engineering, Automation & Services",
    responsibilities:
      "Engineered high-concurrency backend services, automated notification dispatchers, attendance aggregation jobs, and real-time campus data pipelines.",
    systems: [
      "PostgreSQL & Prisma Data Layer",
      "Push Notification & Mail Services",
      "Attendance & Outpass Workflows",
    ],
  },
  SitaRam: {
    formalTitle: "Application Security & Reliability Engineer",
    department: "Authentication, Access Control & Auditing",
    responsibilities:
      "Implemented multi-role institutional authentication, token verification, rate limiting, endpoint hardening, and security auditing across all campus portals.",
    systems: [
      "RBAC & Identity Verification",
      "API Hardening & Rate Limiting",
      "Transcript & Record Integrity",
    ],
  },
};

export function MeetTheDevelopersSection() {
  return (
    <section
      id="developers"
      aria-labelledby="meet-developers-heading"
 className="w-full bg-white py-12 md:py-16 border-b border-line font-sans"
    >
 <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-navy-200 pb-5">
          <div className="space-y-1.5">
 <div className="flex items-center gap-2 text-ink-muted">
 <Building2 className="w-4 h-4 text-navy" />
 <span className="text-[11px] font-medium">
                Core Engineering Roster · RGUKT Ongole
              </span>
            </div>
            <h2
              id="meet-developers-heading"
 className="text-[24px] sm:text-[28px] font-medium text-navy"
            >
              Software Development Cell — Systems Team
            </h2>
          </div>
 <p className="text-[13.5px] text-ink-muted max-w-md">
            Responsible for the architecture, security, and continuous operation
            of RGUKT Ongole&apos;s examination and academic portals.
          </p>
        </div>

        {/* 2x2 Architectural Engineering Directory Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 border border-navy-200 rounded-lg bg-white divide-y md:divide-y-0 divide-navy-200">
          {DEVELOPER_TESTIMONIALS.map((dev, idx) => {
            const meta = ENGINEER_ROLES[dev.name] ?? {
              formalTitle: dev.designation,
              department: "Software Development Cell",
              responsibilities: dev.quote,
              systems: ["Campus Portal Engineering"],
            };

            const borderClasses = [
              idx >= 2 ? "md:border-t md:border-navy-200" : "",
              idx % 2 === 1 ? "md:border-l md:border-navy-200" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <article
                key={dev.name}
 className={`p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:bg-surface-2 transition-colors ${borderClasses}`}
              >
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={dev.src}
                        alt={dev.name}
                        width={72}
                        height={72}
 className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full object-cover border border-[#CBD5E1] bg-surface-2 shrink-0"
                      />
                      <div>
 <span className="inline-block text-[10.5px] font-medium text-ink-muted">
                          {meta.department}
                        </span>
 <h3 className="text-[20px] font-medium text-navy leading-snug mt-0.5">
                          {dev.name}
                        </h3>
 <p className="text-[13.5px] font-semibold text-[#1E293B]">
                          {meta.formalTitle}
                        </p>
                      </div>
                    </div>

                    {dev.linkedin && (
                      <a
                        href={dev.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
 className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-[#CBD5E1] bg-white hover:border-navy text-navy text-[12px] font-medium transition-colors shrink-0"
                      >
                        <span>LinkedIn</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

 <p className="text-[14px] text-[#334155] leading-relaxed">
                    {meta.responsibilities}
                  </p>
                </div>

                <div className="pt-4 border-t border-line flex flex-wrap items-center gap-2">
 <span className="text-[11px] font-medium text-ink-subtle mr-1">
                    Primary Systems:
                  </span>
                  {meta.systems.map((sys) => (
                    <span
                      key={sys}
 className="inline-block px-2.5 py-1 text-[11.5px] font-semibold bg-surface-2 border border-line text-navy rounded-lg"
                    >
                      {sys}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default MeetTheDevelopersSection;
