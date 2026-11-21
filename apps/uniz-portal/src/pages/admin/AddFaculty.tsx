import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "../../components/Input";
import { useIsAuth } from "../../hooks/is_authenticated";
import { toast } from "@/utils/toast-ref";
import { useNavigate } from "react-router-dom";
import { CREATE_FACULTY } from "../../api/endpoints";
import { apiClient } from "../../api/apiClient";
import { PageHeader } from "@/components/ui/page-header";
import {
  adminLabelClass,
  adminSelectClass,
} from "@/components/admin/admin-ui";

const sectionTitleClass =
  "font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head";

export default function AddFaculty() {
  useIsAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    department: "",
    designation: "",
    role: "teacher",
    contact: "",
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (
      !formData.username ||
      !formData.password ||
      !formData.name ||
      !formData.email ||
      !formData.department
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient<any>(CREATE_FACULTY, {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (data && data.success) {
        toast.success("Faculty created successfully!");
        setFormData({
          username: "",
          password: "",
          name: "",
          email: "",
          department: "",
          designation: "",
          role: "teacher",
          contact: "",
        });
      } else {
        toast.error(data?.msg || "Failed to create faculty");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg px-4 py-8">
      <div className="mx-auto w-full max-w-[640px]">
        <PageHeader
          title="Add faculty member"
          meta="Onboard new teaching staff or HODs"
          action={
            <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
              Back
            </Button>
          }
        />

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <h2 className={sectionTitleClass}>Identity</h2>
            <Input
              label="Staff ID / Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. EMP123"
            />
            <Input
              label="Full name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Dr. John Doe"
            />
            <Input
              label="Email address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@university.edu"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Strong password"
            />
          </section>

          <section className="space-y-4 border-t border-border pt-8">
            <h2 className={sectionTitleClass}>Appointment</h2>
            <div>
              <label className={adminLabelClass}>Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={adminSelectClass}
              >
                <option value="">Select Department</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="CIVIL">CIVIL</option>
                <option value="MECH">MECH</option>
                <option value="MME">MME</option>
                <option value="CHEM">CHEM</option>
              </select>
            </div>
            <div>
              <label className={adminLabelClass}>Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={adminSelectClass}
              >
                <option value="teacher">Teacher / Faculty</option>
                <option value="hod">Head of Department (HOD)</option>
              </select>
            </div>
            <Input
              label="Designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="e.g. Assistant Professor"
            />
            <Input
              label="Contact number"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="+91 9876543210"
            />
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-8 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin")}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              Create account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
