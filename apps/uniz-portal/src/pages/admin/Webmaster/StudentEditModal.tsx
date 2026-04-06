/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Target,
  Users,
  Loader2,
  Save,
  Fingerprint,
  Mail,
  Phone,
  Compass,
  Briefcase,
  Home,
  ShieldCheck,
  Heart,
  Globe,
  MapPin,
  Calendar,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { ADMIN_STUDENT_CREATE, ADMIN_UPDATE_STUDENT } from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { cn } from "@/utils/cn";

interface StudentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: any) => void;
  student?: any; 
}

export default function StudentEditModal({
  isOpen,
  onClose,
  onSuccess,
  student,
}: StudentEditModalProps) {
  const isEdit = !!student;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
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
    roomno: "N/A",
    fatherName: "",
    motherName: "",
    fatherOccupation: "",
    motherOccupation: "",
    fatherEmail: "",
    motherEmail: "",
    fatherAddress: "",
    motherAddress: "",
    bloodGroup: "N/A",
    dateOfBirth: "",
    category: "GENERAL",
    campus: "ONGOLE",
    isPresentInCampus: true,
    isSuspended: false,
    cgpa: 0,
    totalBacklogs: 0,
    motivation: "Strive for excellence in every academic pursuit.",
  });

  const [activeSection, setActiveSection] = useState<"primary" | "academic" | "family">("primary");

  useEffect(() => {
    if (student) {
      setFormData({
        ...student,
        dateOfBirth: student.date_of_birth ? new Date(student.date_of_birth).toISOString().split('T')[0] : "",
        phone: student.phone_number || student.phone || "",
      });
    } else {
      setFormData({
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
        roomno: "N/A",
        fatherName: "",
        motherName: "",
        fatherOccupation: "",
        motherOccupation: "",
        fatherEmail: "",
        motherEmail: "",
        fatherAddress: "",
        motherAddress: "",
        bloodGroup: "N/A",
        dateOfBirth: "",
        category: "GENERAL",
        campus: "ONGOLE",
        isPresentInCampus: true,
        isSuspended: false,
        cgpa: 0,
        totalBacklogs: 0,
        motivation: "Strive for excellence in every academic pursuit.",
      });
    }
  }, [student, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("admin_token");
    const id = student?.username || formData.username;
    const url = isEdit ? ADMIN_UPDATE_STUDENT(id) : ADMIN_STUDENT_CREATE;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? "Identity Registry Modified" : "New Student Provisioned");
        onSuccess(data.student);
        onClose();
      } else {
        toast.error(data.message || "Protocol Failure");
      }
    } catch (err) {
      toast.error("Network Synchronicity Lost");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as any).checked : value,
    }));
  };

  const sections = [
    { id: "primary", label: "Identity", icon: <Fingerprint size={16} /> },
    { id: "academic", label: "Academic", icon: <Target size={16} /> },
    { id: "family", label: "Family", icon: <Users size={16} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[85vh] bg-white/90 backdrop-blur-2xl rounded-[3.5rem] shadow-[0_80px_150px_-30px_rgba(0,0,0,0.3)] z-[201] overflow-hidden flex"
          >
            {/* Sidebar Navigation */}
            <div className="w-72 bg-slate-900 flex flex-col p-8 border-r border-slate-800 shrink-0">
              <div className="mb-12">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white mb-6 border border-white/10">
                  <User size={28} />
                </div>
                <h3 className="text-white font-black text-xl tracking-tight leading-none italic uppercase">
                  Reg.<span className="text-slate-400">v2</span>
                </h3>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-2">
                  Identity Provisioning
                </p>
              </div>

              <div className="space-y-2 flex-1">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id as any)}
                    className={cn(
                      "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all group relative overflow-hidden",
                      activeSection === sec.id 
                        ? "bg-white text-slate-900 shadow-xl shadow-white/5" 
                        : "text-slate-500 hover:text-white"
                    )}
                  >
                    {activeSection === sec.id && (
                      <motion.div layoutId="nav-bg" className="absolute inset-0 bg-white" />
                    )}
                    <span className="relative z-10">{sec.icon}</span>
                    <span className="relative z-10">{sec.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-white font-black text-[10px] uppercase tracking-widest mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span className="text-emerald-500 font-black text-[9px] uppercase">Secure Link Active</span>
                </div>
              </div>
            </div>

            {/* Main Form Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="px-12 py-10 flex items-center justify-between shrink-0">
                <div>
                  <h4 className="text-3xl font-black text-slate-900 leading-none tracking-tight uppercase">
                    {isEdit ? "Refine Portfolio" : "Provision Identity"}
                  </h4>
                  <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
                    <Compass size={12} />
                    {isEdit ? `Modifying profile for entry: ${student.username}` : "Allocating new institutional node"}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-12 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all hover:scale-110 active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-12 pb-12 space-y-12 custom-scrollbar">
                
                {activeSection === "primary" && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-10"
                  >
                    <SectionHeader title="Core Identity" subtitle="Fundamental identification parameters" icon={<Fingerprint size={16} />} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <InputGroup label="Node ID (University ID)" name="username" value={formData.username} icon={<Globe size={14}/>} disabled={isEdit} onChange={handleChange} placeholder="e.g. O210008" required />
                      <InputGroup label="Biological Name" name="name" value={formData.name} icon={<User size={14}/>} onChange={handleChange} placeholder="e.g. Sreecharan D" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <InputGroup label="Institutional Email" name="email" value={formData.email} icon={<Mail size={14}/>} onChange={handleChange} placeholder="name@rguktong.ac.in" required />
                      <InputGroup label="Communication Link (Phone)" name="phone" value={formData.phone} icon={<Phone size={14}/>} onChange={handleChange} placeholder="+91 0000000000" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <SelectGroup label="Gender Descriptor" name="gender" value={formData.gender} onChange={handleChange} options={[{v:"M", l:"Male (XY)"}, {v:"F", l:"Female (XX)"}, {v:"Other", l:"Other"}]} />
                       <InputGroup label="Chronological Birth" name="dateOfBirth" value={formData.dateOfBirth} type="date" icon={<Calendar size={14}/>} onChange={handleChange} />
                       <InputGroup label="Hemoglobin Classification" name="bloodGroup" value={formData.bloodGroup} icon={<Heart size={14}/>} onChange={handleChange} placeholder="e.g. O+" />
                    </div>
                  </motion.div>
                )}

                {activeSection === "academic" && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-10"
                  >
                    <SectionHeader title="Academic Allocation" subtitle="Institutional placement and trajectory" icon={<Target size={16} />} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                       <SelectGroup label="Department / Branch" name="branch" value={formData.branch} onChange={handleChange} options={["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME", "AI&ML"].map(b => ({v:b, l:b}))} />
                       <SelectGroup label="Year Cycle" name="year" value={formData.year} onChange={handleChange} options={["P1", "P2", "E1", "E2", "E3", "E4"].map(y => ({v:y, l:y}))} />
                       <SelectGroup label="Semester" name="semester" value={formData.semester} onChange={handleChange} options={["SEM-1", "SEM-2"].map(s => ({v:s, l:s}))} />
                       <InputGroup label="Division (Section)" name="section" value={formData.section} icon={<Compass size={14}/>} onChange={handleChange} placeholder="e.g. A" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <InputGroup label="Cohort Sync (Batch)" name="batch" value={formData.batch} icon={<Users size={14}/>} onChange={handleChange} placeholder="e.g. O21" />
                       <InputGroup label="Living Quarter (Room)" name="roomno" value={formData.roomno} icon={<Home size={14}/>} onChange={handleChange} placeholder="e.g. C-101" />
                       <InputGroup label="Institutional Campus" name="campus" value={formData.campus} icon={<MapPin size={14}/>} onChange={handleChange} placeholder="ONGOLE" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <InputGroup label="Cumulative GPA" name="cgpa" value={formData.cgpa} type="number" step="0.01" icon={<Zap size={14}/>} onChange={handleChange} />
                       <InputGroup label="Active Backlogs" name="totalBacklogs" value={formData.totalBacklogs} type="number" icon={<ShieldAlert size={14}/>} onChange={handleChange} />
                       <InputGroup label="Allocated Category" name="category" value={formData.category} icon={<Briefcase size={14}/>} onChange={handleChange} placeholder="e.g. GENERAL" />
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Behavioral Motivation Profile</label>
                       <textarea
                         name="motivation"
                         value={formData.motivation}
                         onChange={handleChange}
                         placeholder="e.g. Continue to demonstrate exceptional leadership..."
                         rows={2}
                         className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-5 font-bold text-slate-900 text-[13px] outline-none transition-all focus:bg-white focus:border-slate-300 focus:shadow-[0_8px_20px_-10px_rgba(0,0,0,0.05)] resize-none"
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                       <div className="flex gap-6 items-end pb-1">
                          <Switch label="Active Presence" checked={formData.isPresentInCampus} onChange={() => setFormData({...formData, isPresentInCampus: !formData.isPresentInCampus})} color="emerald" />
                          <Switch label="Protocol Suspension" checked={formData.isSuspended} onChange={() => setFormData({...formData, isSuspended: !formData.isSuspended})} color="red" />
                       </div>
                    </div>
                  </motion.div>
                )}

                {activeSection === "family" && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-12"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <SectionHeader title="Patrilineal Link" subtitle="Father's records and domicile" icon={<Users size={14} />} />
                        <div className="space-y-6">
                           <InputGroup label="Legal Name" name="fatherName" value={formData.fatherName} onChange={handleChange} />
                           <InputGroup label="Professional Sector" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} />
                           <InputGroup label="Contact Email" name="fatherEmail" value={formData.fatherEmail} type="email" onChange={handleChange} />
                           <TextAreaGroup label="Residential Domicile" name="fatherAddress" value={formData.fatherAddress} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="space-y-8">
                        <SectionHeader title="Matrilineal Link" subtitle="Mother's records and domicile" icon={<Users size={14} />} />
                        <div className="space-y-6">
                           <InputGroup label="Legal Name" name="motherName" value={formData.motherName} onChange={handleChange} />
                           <InputGroup label="Professional Sector" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} />
                           <InputGroup label="Contact Email" name="motherEmail" value={formData.motherEmail} type="email" onChange={handleChange} />
                           <TextAreaGroup label="Residential Domicile" name="motherAddress" value={formData.motherAddress} onChange={handleChange} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </form>

              {/* Footer */}
              <div className="px-12 py-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-600">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Registrar Proxy Active</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Encryption: AES-256 Validated</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={onClose}
                    className="px-8 h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-3 px-10 h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-800 transition-all disabled:opacity-50 shadow-2xl shadow-slate-900/20 active:scale-95 group"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Save className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                    )}
                    {isEdit ? "Execute Commit" : "Init Provisioning"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SectionHeader({ title, subtitle, icon }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <div className="flex flex-col">
        <h5 className="font-black text-slate-900 uppercase tracking-widest text-[12px]">{title}</h5>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{subtitle}</p>
      </div>
    </div>
  );
}

function InputGroup({ label, name, value, onChange, icon, type = "text", placeholder, required, disabled, step }: any) {
  return (
    <div className="space-y-3 group">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors">
            {icon}
          </div>
        )}
        <input
          name={name}
          type={type}
          step={step}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={cn(
            "w-full h-14 bg-slate-50/50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 text-[13px] outline-none transition-all placeholder:text-slate-300",
            icon && "pl-14",
            "focus:bg-white focus:border-slate-300 focus:shadow-[0_8px_20px_-10px_rgba(0,0,0,0.05)] focus:scale-[1.01]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>
    </div>
  );
}

function TextAreaGroup({ label, name, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-5 font-bold text-slate-900 text-[13px] outline-none transition-all focus:bg-white focus:border-slate-300 focus:shadow-[0_8px_20px_-10px_rgba(0,0,0,0.05)] resize-none"
      />
    </div>
  );
}

function SelectGroup({ label, name, value, onChange, options }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full h-14 bg-slate-50/50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 text-[13px] outline-none transition-all focus:bg-white focus:border-slate-300 focus:shadow-[0_8px_20px_-10px_rgba(0,0,0,0.05)] appearance-none"
      >
        {options.map((opt: any) => (
          <option key={opt.v} value={opt.v}>{opt.l}</option>
        ))}
      </select>
    </div>
  );
}

function Switch({ label, checked, onChange, color }: any) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onChange}
        className={cn(
          "w-12 h-7 rounded-full relative transition-all shadow-inner",
          checked 
            ? (color === "emerald" ? "bg-emerald-500 shadow-emerald-500/20" : "bg-red-500 shadow-red-500/20") 
            : "bg-slate-200"
        )}
      >
        <motion.div
          animate={{ x: checked ? 22 : 4 }}
          className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
        />
      </button>
      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{label}</span>
    </div>
  );
}
