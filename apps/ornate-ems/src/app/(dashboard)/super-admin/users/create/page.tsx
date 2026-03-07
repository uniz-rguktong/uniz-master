"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAdminUser } from "@/actions/superAdminActions";
import { useToast } from "@/hooks/useToast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_OPTIONS = [
  "Branch Admin",
  "Clubs",
  "Sports",
  "HHO",
  "Event Coordinator",
];

const BRANCH_OPTIONS = ["CSE", "ECE", "EEE", "MECH", "CIVIL"];

export default function CreateUserPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Branch Admin",
    branch: "",
    clubId: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.role
    ) {
      showToast("Name, email, password, and role are required", "error");
      return;
    }

    if (
      (form.role === "Branch Admin" || form.role === "Sports") &&
      !form.branch
    ) {
      showToast("Branch is required for selected role", "error");
      return;
    }

    if (form.role === "Clubs" && !form.clubId.trim()) {
      showToast("Club ID is required for Clubs role", "error");
      return;
    }

    setIsSubmitting(true);
    const payload: any = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    };

    if (form.branch) {
      payload.branch = form.branch;
    }

    if (form.clubId.trim()) {
      payload.clubId = form.clubId.trim();
    }

    const result = await createAdminUser(payload);

    setIsSubmitting(false);

    if ("error" in result && result.error) {
      showToast(result.error, "error");
      return;
    }

    showToast("User created successfully", "success");
    router.push("/super-admin/users");
    router.refresh();
  };

  return (
    <div className="p-6 md:p-8 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Add User</h1>
          <p className="text-sm text-[#6B7280]">
            Create a new admin/coordinator user account.
          </p>
        </div>
        <Link
          href="/super-admin/users"
          className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors"
        >
          Back to Users
        </Link>
      </div>

      <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
        <div className="bg-white rounded-[14px] p-6 md:p-8 border border-[#E5E7EB]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                  placeholder="Enter password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Role *
                </label>
                <Select
                  value={form.role}
                  onValueChange={(value) => updateField("role", value)}
                >
                  <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(form.role === "Branch Admin" || form.role === "Sports") && (
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Branch *
                </label>
                <Select
                  value={form.branch}
                  onValueChange={(value) => updateField("branch", value)}
                >
                  <SelectTrigger className="w-full md:w-1/2 px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCH_OPTIONS.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.role === "Clubs" && (
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Club ID *
                </label>
                <input
                  type="text"
                  value={form.clubId}
                  onChange={(e) => updateField("clubId", e.target.value)}
                  required={form.role === "Clubs"}
                  className="w-full md:w-1/2 px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                  placeholder="Enter club id"
                />
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] disabled:opacity-60"
              >
                {isSubmitting ? "Creating..." : "Create User"}
              </button>
              <Link
                href="/super-admin/users"
                className="px-6 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
