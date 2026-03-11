import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail } from "lucide-react";
import {
    getDepartmentStaff,
    type DepartmentData,
    type DeptCode,
} from "../../types/api";
import { FacultySkeleton } from "../ui/Skeletons";

const DEPT_LIST: { code: DeptCode; label: string }[] = [
    { code: "CSE", label: "Computer Science" },
    { code: "ECE", label: "Electronics & Comm." },
    { code: "CIVIL", label: "Civil Engineering" },
    { code: "EEE", label: "Electrical & Electronics" },
    { code: "ME", label: "Mechanical Engg." },
    { code: "IT", label: "Information Tech." },
    { code: "MATHEMATICS", label: "Mathematics" },
    { code: "PHYSICS", label: "Physics" },
    { code: "CHEMISTRY", label: "Chemistry" },
    { code: "ENGLISH", label: "English" },
];

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=001f3f&color=fff&name=";

const FacultyCard = ({
    member,
}: {
    member: { name: string; email: string; photo: string | null };
}) => {
    const cleanName = member.name.replace(/M\.Tech.*|M\.E.*|Ph\.D.*/i, "").trim();
    const initials = cleanName.split(" ").slice(0, 2).join("+");
    const photoSrc = member.photo || `${DEFAULT_AVATAR}${initials}`;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            className="group flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 cursor-default"
        >
            <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-slate-100 group-hover:ring-primary/30 transition-all duration-300">
                <img
                    src={photoSrc}
                    alt={cleanName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.currentTarget.src = `${DEFAULT_AVATAR}${initials}`;
                    }}
                />
            </div>
            <div className="text-center">
                <p className="text-[12px] font-bold text-slate-800 line-clamp-2 leading-snug">
                    {cleanName}
                </p>
                <a
                    href={`mailto:${member.email}`}
                    className="text-[10px] text-slate-400 hover:text-accent transition-colors flex items-center gap-1 justify-center mt-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Mail size={10} />
                    {member.email}
                </a>
            </div>
        </motion.div>
    );
};

export const DepartmentsSection = () => {
    const [activeDept, setActiveDept] = useState<DeptCode>("CSE");
    const [deptData, setDeptData] = useState<Record<string, DepartmentData | null>>({});
    const [loading, setLoading] = useState(false);

    const fetchDept = useCallback(
        async (code: DeptCode) => {
            if (deptData[code] !== undefined) return;
            setLoading(true);
            try {
                const result = await getDepartmentStaff(code);
                setDeptData((prev) => ({ ...prev, [code]: result }));
            } catch {
                setDeptData((prev) => ({ ...prev, [code]: null }));
            } finally {
                setLoading(false);
            }
        },
        [deptData]
    );

    useEffect(() => {
        fetchDept("CSE");
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDept = (code: DeptCode) => {
        setActiveDept(code);
        fetchDept(code);
    };

    const current = deptData[activeDept];

    return (
        <section id="departments" className="py-24 px-10 bg-white border-t border-slate-100">
            <div className="max-w-[1200px] mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-12"
                >
                    <span className="text-accent font-black uppercase tracking-[0.4em] text-[10px] mb-3 block">
                        Our People
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
                        Department <span className="text-primary italic">Faculty.</span>
                    </h2>
                    <p className="text-slate-500 font-medium max-w-xl">
                        Meet the dedicated faculty members powering each department at RGUKT Ongole.
                    </p>
                </motion.div>

                {/* Department tabs */}
                <div className="flex flex-wrap gap-2 mb-10">
                    {DEPT_LIST.map((dept) => (
                        <button
                            key={dept.code}
                            id={`dept-tab-${dept.code}`}
                            onClick={() => handleDept(dept.code)}
                            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${activeDept === dept.code
                                ? "bg-primary text-white shadow-md"
                                : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                }`}
                        >
                            {dept.label}
                        </button>
                    ))}
                </div>

                {/* Faculty grid */}
                {loading && current === undefined ? (
                    <FacultySkeleton />
                ) : !current ? (
                    <p className="text-slate-400 text-sm">Could not load faculty data.</p>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeDept}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                        >
                            {current.faculties.map((member, i) => (
                                <FacultyCard key={i} member={member} />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                )}

                {current && (
                    <p className="mt-6 text-[11px] text-slate-300 font-bold uppercase tracking-widest text-right">
                        {current.faculties.length} faculty members · {current.dept} dept.
                    </p>
                )}
            </div>
        </section>
    );
};
