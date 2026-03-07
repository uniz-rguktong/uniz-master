import type { BulkImportExportConfig } from "./types";

const COMMON_GUIDELINES = [
  "Supported formats: CSV, XLSX, XLS",
  "Maximum file size: 10MB",
  "Required columns: Student Name, Roll Number, Email, Phone, Event Name",
  "Duplicate entries will be skipped automatically",
  "Invalid data will be logged for review",
];

const COMMON_REQUIRED_COLUMNS = [
  "Student Name",
  "Roll Number",
  "Email",
  "Phone",
  "Event Name",
];

const COMMON_EXPORT_FIELDS = [
  "Student Name",
  "Roll Number",
  "Email",
  "Phone",
  "Branch",
  "Year",
  "Event Name",
  "Registration Date",
  "Status",
  "Payment Amount",
  "Attendance",
  "Certificate Status",
];

export const ADMIN_CONFIG: BulkImportExportConfig = {
  importGuidelines: COMMON_GUIDELINES,
  requiredColumns: COMMON_REQUIRED_COLUMNS,
  exportFields: COMMON_EXPORT_FIELDS,
  showBranchFilter: true,
  templateName: "registration_template",
};

export const CLUBS_CONFIG: BulkImportExportConfig = {
  importGuidelines: COMMON_GUIDELINES,
  requiredColumns: COMMON_REQUIRED_COLUMNS,
  exportFields: COMMON_EXPORT_FIELDS,
  showBranchFilter: false,
  templateName: "club_registration_template",
};

export const SPORTS_CONFIG: BulkImportExportConfig = {
  importGuidelines: COMMON_GUIDELINES,
  requiredColumns: COMMON_REQUIRED_COLUMNS,
  exportFields: COMMON_EXPORT_FIELDS,
  showBranchFilter: false,
  templateName: "sports_registration_template",
};
