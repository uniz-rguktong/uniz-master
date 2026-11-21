import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  ClipboardCheck,
  DoorOpen,
  GraduationCap,
  MessageSquare,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Wrap } from "../layout/Wrap";
import { SHOW_OUTPASS, portalPath } from "@/lib/portal";

type Service = {
  icon: LucideIcon;
  label: string;
  line: string;
  href: string;
  external?: boolean;
};

const SERVICES: Service[] = [
  {
    icon: GraduationCap,
    label: "Results",
    line: "Semester results and subjects.",
    href: portalPath("/student/gradehub"),
    external: true,
  },
  {
    icon: CalendarCheck,
    label: "Attendance",
    line: "Attendance for each subject.",
    href: portalPath("/student/attendance"),
    external: true,
  },
  {
    icon: ClipboardCheck,
    label: "Registration",
    line: "Semester registration and deadlines.",
    href: portalPath("/student/registration"),
    external: true,
  },
  {
    icon: MessageSquare,
    label: "Grievance",
    line: "Raise a grievance and follow it.",
    href: portalPath("/student/grievance"),
    external: true,
  },
  {
    icon: Bell,
    label: "Notices",
    line: "Announcements from campus offices.",
    href: "/notifications/news",
  },
  {
    icon: Users,
    label: "Faculty and administrators",
    line: "Classes, grades and student requests.",
    href: portalPath("/admin/signin"),
    external: true,
  },
];

const OUTPASS: Service = {
  icon: DoorOpen,
  label: "Outpass",
  line: "Request an outing and track approval.",
  href: portalPath("/student/outpass"),
  external: true,
};

function services() {
  if (!SHOW_OUTPASS) return SERVICES;
  const next = [...SERVICES];
  next.splice(2, 0, OUTPASS);
  return next.filter((item) => item.label !== "Notices");
}

function Cell({ item }: { item: Service }) {
  const Icon = item.icon;
  const className = "group block min-w-0 border-t border-border-strong pt-8 pb-11";
  const body = (
    <>
      <Icon className="text-accent" size={28} strokeWidth={1.5} aria-hidden="true" />
      <span className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[19px] font-semibold leading-7 text-head">{item.label}</span>
        <ArrowRight className="shrink-0 text-accent" size={20} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="mt-2 block max-w-[300px] text-[15px] leading-6 text-text-2">{item.line}</span>
    </>
  );
  if (item.external) {
    return (
      <a href={item.href} className={className}>
        {body}
      </a>
    );
  }
  return (
    <Link to={item.href} className={className}>
      {body}
    </Link>
  );
}

export function ServiceIndex() {
  return (
    <Wrap>
      <section aria-labelledby="services-heading">
        <h2 id="services-heading" className="u-section text-head">
          Services
        </h2>
        <p className="mt-2.5 text-[17px] leading-[26px] text-text-2">
          Results, attendance and registration open on the student portal.
        </p>
        <div className="mt-8 grid grid-cols-1 min-[821px]:mt-14 min-[821px]:grid-cols-3 min-[821px]:gap-x-14">
          {services().map((item) => (
            <Cell key={item.label} item={item} />
          ))}
        </div>
      </section>
    </Wrap>
  );
}
