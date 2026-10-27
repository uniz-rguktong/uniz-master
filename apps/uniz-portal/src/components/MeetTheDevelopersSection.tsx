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
      className="w-full bg-white py-12 md:py-16 border-b border-[#E2E8F0] font-sans"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D8E0EA] pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#475569]">
              <Building2 className="w-4 h-4 text-[#0A2540]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em]">
                Core Engineering Roster · RGUKT Ongole
              </span>
            </div>
            <h2
              id="meet-developers-heading"
              className="text-[24px] sm:text-[28px] font-bold tracking-[-0.01em] text-[#0A2540]"
            >
              Software Development Cell — Systems Team
            </h2>
          </div>
          <p className="text-[13.5px] text-[#475569] max-w-md">
            Responsible for the architecture, security, and continuous operation
            of RGUKT Ongole&apos;s examination and academic portals.
          </p>
        </div>

        {/* 2x2 Architectural Engineering Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border border-[#D8E0EA] rounded-[2px] bg-white divide-y md:divide-y-0 divide-[#D8E0EA]">
          {DEVELOPER_TESTIMONIALS.map((dev, idx) => {
            const meta = ENGINEER_ROLES[dev.name] ?? {
              formalTitle: dev.designation,
              department: "Software Development Cell",
              responsibilities: dev.quote,
              systems: ["Campus Portal Engineering"],
            };

            const borderClasses = [
              idx >= 2 ? "md:border-t md:border-[#D8E0EA]" : "",
              idx % 2 === 1 ? "md:border-l md:border-[#D8E0EA]" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <article
                key={dev.name}
                className={`p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:bg-[#F8FAFC] transition-colors ${borderClasses}`}
              >
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={dev.src}
                        alt={dev.name}
                        width={72}
                        height={72}
                        className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full object-cover border border-[#CBD5E1] bg-[#F8FAFC] shrink-0"
                      />
                      <div>
                        <span className="inline-block text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#475569]">
                          {meta.department}
                        </span>
                        <h3 className="text-[20px] font-bold text-[#0A2540] leading-snug mt-0.5">
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
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-[2px] border border-[#CBD5E1] bg-white hover:border-[#0A2540] text-[#0A2540] text-[12px] font-bold transition-colors shrink-0"
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

                <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B] mr-1">
                    Primary Systems:
                  </span>
                  {meta.systems.map((sys) => (
                    <span
                      key={sys}
                      className="inline-block px-2.5 py-1 text-[11.5px] font-semibold bg-[#F8FAFC] border border-[#E2E8F0] text-[#0A2540] rounded-[2px]"
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
