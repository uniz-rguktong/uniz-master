/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { ADMIN_STUDENT_CREATE, ADMIN_UPDATE_STUDENT } from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { cn } from "../../../utils/cn";
import {
  adminLabelClass,
  adminInputClass,
  adminSelectClass,
  adminTextareaClass,
} from "../../../components/admin/admin-ui";
import { AdminDialog } from "@/components/admin/AdminDialog";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { ENGINEERING_BRANCHES } from "@/constants/branches";

interface StudentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: any) => void;
  student?: any;
  /** Render above admin drawers (z-[100]+). */
  elevated?: boolean;
}

const BRANCHES = [...ENGINEERING_BRANCHES];
const YEARS = ["E1", "E2", "E3", "E4"];
const SECTIONS = ["primary", "academic", "family"] as const;

const sectionTitleClass =
  "font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head";

const emptyForm = () => ({
  username: "",
  name: "",
  email: "",
  gender: "M",
  phone: "",
  branch: "CSE",
  year: "E1",
  semester: "SEM-1",
  section: "A",
  batch: "O21",
  roomno: "",
  fatherName: "",
  motherName: "",
  fatherOccupation: "",
  motherOccupation: "",
  fatherEmail: "",
  motherEmail: "",
  fatherAddress: "",
  motherAddress: "",
  bloodGroup: "",
  dateOfBirth: "",
  category: "GENERAL",
  campus: "ONGOLE",
  isPresentInCampus: true,
  isSuspended: false,
  cgpa: 0,
  totalBacklogs: 0,
  motivation: "",
});

const GENDER_MAP: Record<string, string> = {
  Male: "M",
  Female: "F",
  M: "M",
  F: "F",
  Other: "Other",
};

const formFromStudent = (student: any) => {
  const base = emptyForm();
  return {
    username: student.username || base.username,
    name: student.name || base.name,
    email: student.email || base.email,
    gender: GENDER_MAP[student.gender] || student.gender || base.gender,
    phone: student.phone_number || student.phone || base.phone,
    branch: student.branch || base.branch,
    year: student.year || base.year,
    semester: student.semester || base.semester,
    section: student.section || base.section,
    batch: student.batch || base.batch,
    roomno: student.roomno || student.room_number || base.roomno,
    fatherName: student.father_name || student.fatherName || base.fatherName,
    motherName: student.mother_name || student.motherName || base.motherName,
    fatherOccupation:
      student.father_occupation || student.fatherOccupation || base.fatherOccupation,
    motherOccupation:
      student.mother_occupation || student.motherOccupation || base.motherOccupation,
    fatherEmail: student.father_email || student.fatherEmail || base.fatherEmail,
    motherEmail: student.mother_email || student.motherEmail || base.motherEmail,
    fatherAddress:
      student.father_address || student.fatherAddress || base.fatherAddress,
    motherAddress:
      student.mother_address || student.motherAddress || base.motherAddress,
    bloodGroup: student.blood_group || student.bloodGroup || base.bloodGroup,
    dateOfBirth: student.date_of_birth
      ? new Date(student.date_of_birth).toISOString().split("T")[0]
      : student.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().split("T")[0]
        : base.dateOfBirth,
    category: student.category || base.category,
    campus: student.campus || base.campus,
    isPresentInCampus:
      student.isPresentInCampus ?? student.is_in_campus ?? base.isPresentInCampus,
    isSuspended:
      student.isSuspended ?? student.is_suspended ?? base.isSuspended,
    cgpa: student.cgpa ?? base.cgpa,
    totalBacklogs: student.totalBacklogs ?? student.total_backlogs ?? base.totalBacklogs,
    motivation: student.motivation || base.motivation,
  };
};

const buildSubmitPayload = (formData: any) => {
  const payload: Record<string, unknown> = {};
  for (const key of Object.keys(emptyForm())) {
    payload[key] = formData[key];
  }
  return payload;
};

export default function StudentEditModal({
  isOpen,
  onClose,
  onSuccess,
  student,
  elevated = false,
}: StudentEditModalProps) {
  const isEdit = !!student;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>(emptyForm());
  const [activeSection, setActiveSection] =
    useState<(typeof SECTIONS)[number]>("primary");

  useEffect(() => {
    if (!isOpen) return;
    if (student) {
      setFormData(formFromStudent(student));
    } else {
      setFormData(emptyForm());
    }
    setActiveSection("primary");
  }, [student, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    const id = student?.username || formData.username;
    const url = isEdit ? ADMIN_UPDATE_STUDENT(id) : ADMIN_STUDENT_CREATE;

    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
        },
        body: JSON.stringify(buildSubmitPayload(formData)),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? "Student updated" : "Student created");
        onSuccess(data.student);
        onClose();
      } else {
        toast.error(data.message || "Save failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <AdminDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      elevated={elevated}
      maxWidth="max-w-[640px]"
      className="max-h-[90vh] overflow-y-auto"
      title={isEdit ? "Edit student" : "Add student"}
      description={
        isEdit
          ? `Update profile for ${student.username}`
          : "Create a new student record in the registry."
      }
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="student-edit-form"
            isLoading={loading}
          >
            {isEdit ? "Save changes" : "Create student"}
          </Button>
        </>
      }
    >
      <form id="student-edit-form" onSubmit={handleSubmit} className="space-y-6">
        <Tabs
          label="Student sections"
          value={activeSection}
          onChange={(id) => setActiveSection(id as (typeof SECTIONS)[number])}
          tabs={[
            { id: "primary", label: "Identity" },
            { id: "academic", label: "Academic" },
            { id: "family", label: "Family" },
          ]}
        />

        {activeSection === "primary" && (
          <div className="space-y-4">
            <Field label="Student ID" name="username" value={formData.username} onChange={handleChange} required disabled={isEdit} />
            <Field label="Full name" name="name" value={formData.name} onChange={handleChange} required />
            <Field label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <Field label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
            <SelectField label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={[{ v: "M", l: "Male" }, { v: "F", l: "Female" }, { v: "Other", l: "Other" }]} />
            <Field label="Date of birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
            <SelectField label="Blood group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "N/A"].map((v) => ({ v, l: v }))} />
          </div>
        )}

        {activeSection === "academic" && (
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className={sectionTitleClass}>Placement</h2>
              <SelectField label="Branch" name="branch" value={formData.branch} onChange={handleChange} options={BRANCHES.map((b) => ({ v: b, l: b }))} />
              <SelectField label="Year" name="year" value={formData.year} onChange={handleChange} options={YEARS.map((y) => ({ v: y, l: y }))} />
              <SelectField label="Semester" name="semester" value={formData.semester} onChange={handleChange} options={[{ v: "SEM-1", l: "SEM-1" }, { v: "SEM-2", l: "SEM-2" }]} />
              <Field label="Section" name="section" value={formData.section} onChange={handleChange} />
              <Field label="Batch" name="batch" value={formData.batch} onChange={handleChange} />
              <Field label="Room" name="roomno" value={formData.roomno} onChange={handleChange} />
              <Field label="Campus" name="campus" value={formData.campus} onChange={handleChange} />
            </section>
            <section className="space-y-4 border-t border-border pt-8">
              <h2 className={sectionTitleClass}>Record</h2>
              <Field label="CGPA" name="cgpa" type="number" step="0.01" value={formData.cgpa} onChange={handleChange} />
              <Field label="Backlogs" name="totalBacklogs" type="number" value={formData.totalBacklogs} onChange={handleChange} />
              <Field label="Category" name="category" value={formData.category} onChange={handleChange} />
              <div>
                <label className={adminLabelClass}>Motivation note</label>
                <textarea name="motivation" value={formData.motivation} onChange={handleChange} rows={2} className={adminTextareaClass} />
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                <Toggle label="On campus" checked={formData.isPresentInCampus} onChange={() => setFormData((p: any) => ({ ...p, isPresentInCampus: !p.isPresentInCampus }))} />
                <Toggle label="Suspended" checked={formData.isSuspended} onChange={() => setFormData((p: any) => ({ ...p, isSuspended: !p.isSuspended }))} danger />
              </div>
            </section>
          </div>
        )}

        {activeSection === "family" && (
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className={sectionTitleClass}>Father</h2>
              <Field label="Name" name="fatherName" value={formData.fatherName} onChange={handleChange} />
              <Field label="Occupation" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} />
              <Field label="Email" name="fatherEmail" type="email" value={formData.fatherEmail} onChange={handleChange} />
              <div>
                <label className={adminLabelClass}>Address</label>
                <textarea name="fatherAddress" value={formData.fatherAddress} onChange={handleChange} rows={2} className={adminTextareaClass} />
              </div>
            </section>
            <section className="space-y-4 border-t border-border pt-8">
              <h2 className={sectionTitleClass}>Mother</h2>
              <Field label="Name" name="motherName" value={formData.motherName} onChange={handleChange} />
              <Field label="Occupation" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} />
              <Field label="Email" name="motherEmail" type="email" value={formData.motherEmail} onChange={handleChange} />
              <div>
                <label className={adminLabelClass}>Address</label>
                <textarea name="motherAddress" value={formData.motherAddress} onChange={handleChange} rows={2} className={adminTextareaClass} />
              </div>
            </section>
          </div>
        )}
      </form>
    </AdminDialog>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  disabled,
  step,
}: any) {
  return (
    <div>
      <label className={adminLabelClass}>{label}</label>
      <input
        name={name}
        type={type}
        step={step}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={cn(adminInputClass, disabled && "opacity-[0.45]")}
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }: any) {
  return (
    <div>
      <label className={adminLabelClass}>{label}</label>
      <select name={name} value={value} onChange={onChange} className={adminSelectClass}>
        {options.map((opt: { v: string; l: string }) => (
          <option key={opt.v} value={opt.v}>
            {opt.l}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  danger,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  danger?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-dense font-medium text-text">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          "relative h-6 w-10 rounded-full transition-colors",
          checked ? (danger ? "bg-error" : "bg-primary") : "bg-tint",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-4 w-4 rounded-full bg-surface transition-transform",
            checked ? "left-5" : "left-1",
          )}
        />
      </button>
      {label}
    </label>
  );
}
