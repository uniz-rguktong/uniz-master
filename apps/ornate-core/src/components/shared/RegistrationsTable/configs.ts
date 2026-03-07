import type { RegistrationsTableConfig } from "./types";
import React from "react";

import { SafeDate } from "./components/SafeDate";

const getStatusBadge = (status: string) => {
  const styles: any = {
    confirmed: { bg: "#D1FAE5", text: "#065F46", label: "Confirmed" },
    pending: { bg: "#FEF3C7", text: "#92400E", label: "Pending Payment" },
    "pending-payment": {
      bg: "#FEF3C7",
      text: "#92400E",
      label: "Pending Payment",
    },
    waitlisted: { bg: "#DBEAFE", text: "#1E40AF", label: "Waitlist" },
    attended: { bg: "#D1FAE5", text: "#065F46", label: "Attended" },
  };
  const style = styles[status] || {
    bg: "#F3F4F6",
    text: "#1F2937",
    label: status,
  };

  return React.createElement(
    "span",
    {
      className:
        "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
      style: { backgroundColor: style.bg, color: style.text },
    },
    style.label,
  );
};

export const ADMIN_CONFIG: RegistrationsTableConfig = {
  title: "All Registrations",
  description: "Manage all event registrations across different statuses",
  role: "super-admin",
  showMetrics: true,
  teamSupport: true,
  columns: [
    { key: "registrationId", label: "Registration ID", sortable: true },
    {
      key: "student",
      label: "Student Details",
      sortable: true,
      render: (reg) =>
        React.createElement(
          "div",
          {},
          React.createElement(
            "div",
            { className: "font-medium text-[#1A1A1A]" },
            reg.studentName,
          ),
          React.createElement(
            "div",
            { className: "text-xs text-[#6B7280]" },
            `${reg.rollNumber} • ${reg.year}`,
          ),
        ),
    },
    { key: "eventName", label: "Event", sortable: true },
    {
      key: "registrationDate",
      label: "Registration Date",
      sortable: true,
      render: (reg) =>
        React.createElement(
          "div",
          {},
          React.createElement(SafeDate, {
            date: reg.registrationDate,
            className: "text-sm text-[#1A1A1A]",
            type: "date",
          }),
          React.createElement(SafeDate, {
            date: reg.registrationDate,
            className: "text-xs text-[#6B7280]",
            type: "time",
          }),
        ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (reg) => getStatusBadge(reg.status),
    },
  ],
  teamColumns: [
    { key: "teamName", label: "Team Name" },
    { key: "leaderName", label: "Leader" },
    { key: "event", label: "Event" },
    {
      key: "status",
      label: "Status",
      render: (team) => getStatusBadge(team.status),
    },
  ],
};

export const SPORTS_CONFIG: RegistrationsTableConfig = {
  ...ADMIN_CONFIG,
  title: "Participation Registry",
  description:
    "Oversee and validate every athlete enrollment across the sports department",
  role: "sports",
};

export const CLUBS_CONFIG: RegistrationsTableConfig = {
  ...ADMIN_CONFIG,
  title: "Club Registrations",
  description: "Manage student enrollments for club events and workshops",
  role: "clubs",
};

export const HHO_CONFIG: RegistrationsTableConfig = {
  ...ADMIN_CONFIG,
  title: "HHO Registrations",
  description:
    "Manage registrations for Humanitarian & Health Organization events",
  role: "hho",
};
