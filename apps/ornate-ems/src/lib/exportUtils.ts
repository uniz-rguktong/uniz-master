/**
 * Utility to export data as CSV and trigger a browser download
 */
export const downloadCSV = (
  data: any[],
  filename: string = "export.csv",
  headers: Record<string, string> | null = null,
): void => {
  if (!data || !data.length || typeof document === "undefined") return;

  let csvContent = "";

  // 1. Determine columns
  const columns = headers ? Object.keys(headers) : Object.keys(data[0]);
  const displayHeaders = headers ? Object.values(headers) : columns;

  // 2. Add Header Row
  csvContent +=
    displayHeaders.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(",") +
    "\n";

  // 3. Add Data Rows
  data.forEach((row) => {
    const rowData = columns.map((col) => {
      let val = row[col] === null || row[col] === undefined ? "" : row[col];
      // Format dates if they look like date strings
      if (
        typeof val === "string" &&
        val.includes("T") &&
        !isNaN(Date.parse(val))
      ) {
        val = new Date(val).toLocaleString("en-US", { hour12: true });
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvContent += rowData.join(",") + "\n";
  });

  // 4. Create Blob and Trigger Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export interface ExportRegistration {
  registrationId?: string;
  id?: string;
  studentName?: string;
  name?: string;
  rollNumber?: string;
  roll?: string;
  email?: string;
  phone?: string;
  department?: string;
  branch?: string;
  year?: string;
  eventName?: string;
  event?: { title: string };
  registrationDate?: string;
  createdAt?: string;
  status?: string;
  paymentAmount?: number;
  amount?: number;
  transactionId?: string;
}

/**
 * Specifically format and export registrations
 */
export const exportRegistrationsToCSV = (
  registrations: ExportRegistration[],
  filename: string = "registrations.csv",
): void => {
  if (!registrations || !registrations.length) return;

  const exportData = registrations.map((reg) => ({
    "Registration ID":
      reg.registrationId || reg.id?.substring(0, 8).toUpperCase(),
    "Student Name": reg.studentName || reg.name || "N/A",
    "Roll Number": reg.rollNumber || reg.roll || "N/A",
    Email: reg.email || "N/A",
    Phone: reg.phone || "N/A",
    Branch: reg.department || reg.branch || "N/A",
    Year: reg.year || "N/A",
    "Event Name": reg.eventName || reg.event?.title || "N/A",
    "Registration Date": reg.registrationDate || reg.createdAt || "N/A",
    Status: reg.status || "N/A",
    "Payment Amount": reg.paymentAmount || reg.amount || 0,
    "Transaction ID": reg.transactionId || "N/A",
  }));

  downloadCSV(exportData, filename);
};

export interface ExportTeamMember {
  name: string;
  studentId: string;
}

export interface ExportTeam {
  id?: string;
  teamName: string;
  sport?: string;
  eventName?: string;
  captain: string;
  viceCaptain?: string;
  status: string;
  registeredDate?: string;
  createdAt?: string;
  members?: ExportTeamMember[];
}

/**
 * Specifically format and export team registrations
 */
export const exportTeamsToCSV = (
  teams: ExportTeam[],
  filename: string = "team_registrations.csv",
): void => {
  if (!teams || !teams.length) return;

  const exportData = teams.map((team) => ({
    "Team ID": team.id?.substring(0, 8).toUpperCase(),
    "Team Name": team.teamName,
    Event: team.sport || team.eventName,
    Captain: team.captain,
    "Vice Captain": team.viceCaptain || "N/A",
    Status: team.status,
    "Registered Date": team.registeredDate || team.createdAt,
    "Member Count": team.members?.length || 0,
    Members:
      team.members?.map((m) => `${m.name} (${m.studentId})`).join("; ") ||
      "N/A",
  }));

  downloadCSV(exportData, filename);
};
