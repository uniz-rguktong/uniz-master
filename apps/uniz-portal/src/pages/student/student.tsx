import { useState, useEffect, useCallback, useRef } from "react";
import { useRecoilValue } from "recoil";
import { useSearchParams } from "react-router-dom";
import {
  User,
  Droplets,
  Phone,
  GraduationCap,
  IdCard,
  History as HistoryIcon,
  Clock,
  Calendar,
  MapPin,
  Mail,
  Briefcase,
  Award,
  LayoutGrid,
  Loader2,
  Camera,
  Pencil,
  BadgeCheck,
} from "lucide-react";
import { student } from "../../store";
import { useIsAuth } from "../../hooks/is_authenticated";
import { useStudentData } from "../../hooks/student_info";
import { apiClient } from "../../api/apiClient";
import {
  UPDATE_DETAILS,
  STUDENT_HISTORY,
  REQUEST_OUTING,
  REQUEST_OUTPASS,
  GET_STUDENT_SEATING,
} from "../../api/endpoints";
import { motion, AnimatePresence } from "framer-motion";
import RequestCard from "../../components/RequestCard";
import { toast } from "@/utils/toast-ref";
import { Pagination } from "../../components/Pagination";
import { useWebSocket } from "../../hooks/useWebSocket";
import { InfoCard } from "./components/InfoCard";
import AcademicRecord from "./components/AcademicRecord";
import MySubjects from "./components/MySubjects";
import SeatingArrangement from "./components/SeatingArrangement";
import { Student } from "../../types";
import { BackgroundIconCloud } from "../../components/illustrations/FloatingIllustrations";
import StudentAnalytics from "./components/StudentAnalytics";

export const enableOutingsAndOutpasses = false;

//
//
//

export default function StudentProfilePage() {
  useIsAuth();
  const { refetch } = useStudentData();
  const user = useRecoilValue<Student | any>(student);
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to handle URL query param for editing
  useEffect(() => {
    if (searchParams.get("edit") === "true") {
      setIsEditing(true);
      // Clear the query param so it doesn't persist
      setSearchParams(
        (params) => {
          const newParams = new URLSearchParams(params);
          newParams.delete("edit");
          return newParams;
        },
        { replace: true },
      );
    }
    // Handle tab from query
    const tabParam = searchParams.get("tab");
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams, setSearchParams]);

  // Request State
  const [requestType, setRequestType] = useState<"outing" | "outpass" | null>(
    null,
  );
  const [requestForm, setRequestForm] = useState({
    reason: "",
    from: "",
    to: "",
  });
  const [requestLoading, setRequestLoading] = useState(false);

  // History State
  const [history, setHistory] = useState<any[]>([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Fields State
  const [fields, setFields] = useState<any>({
    name: "",
    gender: "",
    address: "",
    bloodGroup: "",
    phoneNumber: "",
    dateOfBirth: "",
    fatherName: "",
    motherName: "",
    fatherOccupation: "",
    motherOccupation: "",
    fatherEmail: "",
    motherEmail: "",
    fatherAddress: "",
    motherAddress: "",
    fatherPhoneNumber: "",
    motherPhoneNumber: "",
  });

  // WebSocket
  useWebSocket(undefined, (msg) => {
    if (msg.type === "REFRESH_REQUESTS" && msg.payload.userId === user?._id) {
      refetch();
      toast.info(`Request updated: ${msg.payload.status}`);
    }
  });

  // Polling removed - now handled centrally in useStudentData hook

  // Helper to derive initial fields from user user object
  const getInitialFields = (userData: any) => ({
    name: userData?.name || "",
    gender: userData?.gender || "",
    address: userData?.address || userData?.Address || "", // Handle different casing if any
    bloodGroup: userData?.blood_group || userData?.BloodGroup || "",
    phoneNumber: userData?.phone_number || userData?.PhoneNumber || "",
    dateOfBirth: userData?.date_of_birth
      ? new Date(userData.date_of_birth).toISOString().split("T")[0]
      : "",
    fatherName: userData?.father_name || "",
    motherName: userData?.mother_name || "",
    fatherOccupation: userData?.father_occupation || "",
    motherOccupation: userData?.mother_occupation || "",
    fatherEmail: userData?.father_email || "",
    motherEmail: userData?.mother_email || "",
    fatherAddress: userData?.father_address || "",
    motherAddress: userData?.mother_address || "",
    fatherPhoneNumber: userData?.father_phonenumber || "",
    motherPhoneNumber: userData?.mother_phonenumber || "",
  });

  // Init Data
  useEffect(() => {
    if (user && Object.keys(user).length > 0) {
      setFields(getInitialFields(user));
      setIsLoading(false);
    }
  }, [user]);

  // Fetch History
  const fetchHistory = async (page = 1) => {
    try {
      setIsHistoryLoading(true);
      const data = await apiClient<any>(
        `${STUDENT_HISTORY}?page=${page}&limit=5`,
        {
          method: "GET",
        },
      );
      if (data && data.success) {
        setHistory(data.history);
        setHistoryPagination(data.pagination);
      }
    } catch (err) {
      console.error("fetchHistory error:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "permissions") fetchHistory(1);
  }, [activeTab]);

  // Handlers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
      );

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData },
      );
      const data = await res.json();

      if (data.secure_url) {
        // Only send profile_url — don't mix in personal fields
        const updateRes = await apiClient<any>(UPDATE_DETAILS, {
          method: "PUT",
          body: JSON.stringify({ profile_url: data.secure_url }),
        });
        if (updateRes && updateRes.success) {
          toast.success("Profile photo updated!");
          await refetch();
        } else {
          toast.error("Failed to update profile photo.");
        }
      } else {
        toast.error("Image upload failed. Please try again.");
      }
    } catch (err) {
      toast.error("Failed to upload image.");
      console.error(err);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFieldChange = useCallback((name: string, value: any) => {
    setFields((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e: any) => {
    if (e) e.preventDefault();

    const initialFields = getInitialFields(user);
    const updatedFields: Record<string, any> = {};

    Object.keys(fields).forEach((key) => {
      const typedKey = key as keyof typeof fields;
      // Compare current field value with initial value
      if (
        fields[typedKey] !==
        initialFields[typedKey as keyof typeof initialFields]
      ) {
        updatedFields[key] = fields[typedKey];
      }
    });

    if (Object.keys(updatedFields).length === 0) {
      toast.info("No modifications were made.");
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await apiClient<any>(UPDATE_DETAILS, {
        method: "PUT",
        body: JSON.stringify(updatedFields),
      });
      if (data && data.success) {
        await refetch();
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      }
    } catch (err: any) {
      console.error("Profile update failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestType) return;
    setRequestLoading(true);

    try {
      let bodyData;
      if (requestType === "outpass") {
        if (!requestForm.from || !requestForm.to) {
          toast.error("Please select both From and To dates");
          setRequestLoading(false);
          return;
        }

        const fromDate = new Date(requestForm.from);
        const toDate = new Date(requestForm.to);

        if (toDate < fromDate) {
          toast.error("Return date cannot be before departure date");
          setRequestLoading(false);
          return;
        }

        bodyData = {
          reason: requestForm.reason,
          fromDay: fromDate.toISOString(),
          toDay: toDate.toISOString(),
        };
      } else {
        // Outing
        if (!requestForm.from || !requestForm.to) {
          toast.error("Please select both From and To times");
          setRequestLoading(false);
          return;
        }

        // For outing, we assume today's date if only time requested, but usually it's full ISO in backends or separate.
        // Backend expects fromTime and toTime as ISO strings.
        const today = new Date();
        const start = new Date(today);
        const [startH, startM] = requestForm.from.split(":").map(Number);
        if (!isNaN(startH)) start.setHours(startH, startM, 0, 0);

        const end = new Date(today);
        const [endH, endM] = requestForm.to.split(":").map(Number);
        if (!isNaN(endH)) end.setHours(endH, endM, 0, 0);

        bodyData = {
          reason: requestForm.reason,
          fromTime: start.toISOString(),
          toTime: end.toISOString(),
        };
      }

      const endpoint =
        requestType === "outing" ? REQUEST_OUTING : REQUEST_OUTPASS;
      const data = await apiClient<any>(endpoint, {
        method: "POST",
        body: JSON.stringify(bodyData),
      });

      if (data && data.success) {
        toast.success(
          `${requestType.charAt(0).toUpperCase() + requestType.slice(1)} requested successfully!`,
        );
        setRequestType(null);
        setRequestForm({ reason: "", from: "", to: "" });
        refetch();
      }
    } catch (err: any) {
      console.error("Request failed", err);
    } finally {
      setRequestLoading(false);
    }
  };

  // Seating Summary Widget
  const SeatingSummaryWidget = () => {
    const [seating, setSeating] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchSeating = async () => {
        try {
          const data = await apiClient<any>(GET_STUDENT_SEATING);
          if (data && data.seating) {
            setSeating(data.seating);
          }
        } catch (err) {
          console.error("Failed to fetch seating summary", err);
        } finally {
          setLoading(false);
        }
      };
      fetchSeating();
    }, []);

    if (loading || seating.length === 0) return null;

    const now = new Date();
    const upcoming = seating
      .filter((s) => s.date && new Date(s.date) >= now)
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )[0];

    if (!upcoming) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-[24px] p-6 text-white shadow-xl shadow-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md text-navy-300">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Upcoming Examination
            </p>
            <h3 className="text-lg font-bold leading-tight pt-1">
              {upcoming.subjectName}
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              {upcoming.examName} •{" "}
              {new Date(upcoming.date).toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none px-5 py-3 bg-white/10 rounded-2xl text-center border border-white/5">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-0.5">
              Hall
            </p>
            <p className="text-xl font-black">{upcoming.room}</p>
          </div>
          <button
            onClick={() => setActiveTab("seating")}
            className="flex-1 md:flex-none px-6 py-4 bg-navy-900 hover:bg-navy-800 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
          >
            View Full Plan
          </button>
        </div>
      </motion.div>
    );
  };

  if (!user && !isLoading)
    return (
      <div className="flex h-screen items-center justify-center text-slate-400 font-medium">
        Loading Student Profile...
      </div>
    );

  const personalFields = [
    {
      icon: <User className="w-4 h-4" />,
      label: "Full Name",
      name: "name",
      editable: true,
    },
    {
      icon: <User className="w-4 h-4" />,
      label: "Gender",
      name: "gender",
      editable: true,
    },

    {
      icon: <Droplets className="w-4 h-4" />,
      label: "Blood Group",
      name: "bloodGroup",
      editable: true,
    },
    {
      icon: <Phone className="w-4 h-4" />,
      label: "Phone",
      name: "phoneNumber",
      editable: true,
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: "Date of Birth",
      name: "dateOfBirth",
      editable: true,
      type: "date",
    },
  ];

  const academicFields = [
    {
      icon: <IdCard className="w-4 h-4" />,
      label: "Student ID",
      name: "username",
      value: user?.username,
    },
    {
      icon: <GraduationCap className="w-4 h-4" />,
      label: "Year",
      name: "year",
      value: user?.year,
    },
    {
      icon: <Award className="w-4 h-4" />,
      label: "Branch",
      name: "branch",
      value: user?.branch,
    },
    {
      icon: <LayoutGrid className="w-4 h-4" />,
      label: "Section",
      name: "section",
      value: user?.section || "A",
    },
    {
      icon: <MapPin className="w-4 h-4" />,
      label: "Room No",
      name: "roomno",
      value: user?.roomno || "N/A",
    },
  ];

  return (
    <div className="font-sans text-slate-900 relative">
      {/* Absolute Decorative Icon Cloud (Expansive Backdrop) */}
      <BackgroundIconCloud />

      <div className="container mx-auto px-4 max-w-5xl relative z-10 pt-2">
        {/* Profile Header */}
        <div className="flex flex-col items-center justify-center relative mb-8">
          {/* Actions - Top Right Absolute Position (Desktop Only) */}
          <div className="hidden md:flex absolute top-0 right-0 gap-2 shrink-0 z-20">
            {isEditing && (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    refetch();
                  }}
                  className="uniz-primary-btn h-auto px-4 py-1.5 bg-white text-slate-600 border border-slate-200 shadow-sm text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="uniz-primary-btn h-auto px-4 py-1.5 text-xs inline-flex items-center"
                >
                  {isSubmitting && (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  )}{" "}
                  Save
                </button>
              </>
            )}
          </div>

          {/* Centered Avatar and Info */}
          <div className="flex flex-col items-center mt-4">
            {/* Avatar with upload state */}
            <div
              className="relative p-[4px] md:p-[5px] rounded-full mb-4"
              style={{
                background: "#2ebd59",
                boxShadow: "0 0 0 1px rgba(46, 189, 89, 0.1)",
              }}
            >
              <div className="relative bg-slate-50 p-[3px] rounded-full">
                <div className="relative w-[100px] h-[100px] md:w-[124px] md:h-[124px] bg-[#004e43] rounded-full flex justify-center items-center text-white text-[50px] md:text-[60px] font-medium overflow-hidden">
                  {/* Profile image or initial */}
                  {user?.profile_url ? (
                    <img
                      src={user.profile_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : user?.name ? (
                    <span className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none">{user?.name?.[0]?.toUpperCase() || "S"}</span>
                  ) : (
                    <span className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none">S</span>
                  )}

                  {/* Dark blurry overlay — contained fully inside the circle */}
                  <AnimatePresence>
                    {isUploadingImage && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 rounded-full flex items-center justify-center"
                        style={{
                          background: "rgba(0, 0, 0, 0.55)",
                          backdropFilter: "blur(6px)",
                          WebkitBackdropFilter: "blur(6px)",
                        }}
                      >
                        <Loader2
                          className="w-9 h-9 text-white animate-spin"
                          strokeWidth={2}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Camera Icon Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="absolute bottom-[-1px] right-2 w-8 h-8 bg-navy-100 border-[1.5px] border-navy-900 rounded-full flex items-center justify-center text-navy-800 hover:bg-navy-200 transition-all z-20 cursor-pointer shadow-sm hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Update Profile Photo"
              >
                <Camera
                  className="w-[18px] h-[18px] overflow-hidden"
                  strokeWidth={2.5}
                />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            <div className="flex justify-center items-center mb-1.5 mt-1">
              <div className="relative">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.01em] text-[#1f2122] leading-tight text-center max-w-[85vw] md:max-w-none">
                  {user?.name}
                </h1>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute -right-8 md:-right-10 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-transparent text-slate-400 hover:bg-slate-100 hover:text-navy-900 transition-all"
                    title="Edit Profile"
                  >
                    <Pencil
                      className="w-[18px] h-[18px] shrink-0"
                      strokeWidth={2}
                    />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[#3c4043] font-medium text-[13px] tracking-tight text-center relative mb-3.5 flex items-center justify-center gap-1">
              {user?.email || user?.username + "@rguktong.ac.in"}
              <BadgeCheck
                className="w-[15px] h-[15px] text-[#2ebd59]"
                fill="#2ebd59"
                fillOpacity={0.15}
                strokeWidth={2.5}
              />
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] md:text-xs font-medium text-slate-500 mt-1">
              <span className="text-navy-900 font-bold uppercase tracking-widest px-2 py-1 bg-navy-50 border border-navy-100 rounded">
                {user?.username}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="uppercase tracking-wide font-bold text-slate-600">
                {user?.branch} • {user?.year}
              </span>
              {user?.has_pending_requests && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="text-amber-600 px-2 py-1 bg-amber-50 border border-amber-100 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                    <Clock className="w-3 h-3" /> PENDING ACTION
                  </span>
                </>
              )}
            </div>
            {/* Mobile Actions */}
            {isEditing && (
              <div className="md:hidden flex flex-col items-center mt-6 w-full">
                <div className="flex gap-3 w-full justify-center mb-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      refetch();
                    }}
                    className="flex-1 max-w-[140px] py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-xs shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 max-w-[140px] py-2.5 bg-navy-900 text-white rounded-xl font-bold text-xs shadow-md shadow-navy-100 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    Save Changes
                  </button>
                </div>
                <p className="text-[10px] font-bold text-red-500 text-center uppercase tracking-wider">
                  Update the details below and click save changes
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
          <div className="flex gap-8 min-w-max">
            {[
              "personal",
              "academic",
              "registration",
              "seating",
              "family",
              enableOutingsAndOutpasses ? "permissions" : "",
            ]
              .filter(Boolean)
              .map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab || "personal")}
                    className={`pb-3 relative text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${activeTab === tab
                    ? "text-navy-900"
                    : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-navy-900 rounded-t-full"
                    />
                  )}
                </button>
              ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "personal" && (
              <div className="space-y-6">
                <SeatingSummaryWidget />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {personalFields.map((f) => (
                    <InfoCard
                      key={f.name}
                      {...f}
                      value={fields[f.name]}
                      isEditing={isEditing}
                      isLoading={isLoading}
                      onValueChange={handleFieldChange}
                    />
                  ))}
                </div>
                {/* Modern Analytics Section integrated into Personal view */}
                {user?.username && <StudentAnalytics studentId={user.username} />}
              </div>
            )}

            {activeTab === "academic" && (
              <div className="space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-1.5 bg-navy-900 rounded-full"></div>
                    <h3 className="text-[17px] font-semibold tracking-tight text-slate-900">
                      Academic Overview
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {academicFields.map((f) => (
                      <InfoCard
                        key={f.name}
                        {...f}
                        value={f.value}
                        isEditing={false}
                        isLoading={isLoading}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* AcademicRecord will render its own grid/tables if data exists */}
                  <AcademicRecord student={user} />
                </div>
              </div>
            )}

            {activeTab === "registration" && (
              <MySubjects
                studentId={user?.username}
                branch={user?.branch}
                year={user?.year}
              />
            )}

            {activeTab === "seating" && (
              <SeatingArrangement studentId={user?.username} />
            )}

            {activeTab === "family" && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <h3 className="text-[17px] font-semibold tracking-tight text-slate-900">
                      Father's Details
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <InfoCard
                      key="fatherName"
                      label="Name"
                      name="fatherName"
                      icon={<User className="w-3 h-3" />}
                      value={fields.fatherName}
                      isEditing={isEditing}
                      onValueChange={handleFieldChange}
                      editable
                    />
                    <InfoCard
                      key="fatherOccupation"
                      label="Occupation"
                      name="fatherOccupation"
                      icon={<Briefcase className="w-3 h-3" />}
                      value={fields.fatherOccupation}
                      isEditing={isEditing}
                      onValueChange={handleFieldChange}
                      editable
                    />

                    <InfoCard
                      key="fatherEmail"
                      label="Email"
                      name="fatherEmail"
                      type="email"
                      icon={<Mail className="w-3 h-3" />}
                      value={fields.fatherEmail}
                      isEditing={isEditing}
                      onValueChange={handleFieldChange}
                      editable={false}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <h3 className="text-[17px] font-semibold tracking-tight text-slate-900">
                      Mother's Details
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <InfoCard
                      key="motherName"
                      label="Name"
                      name="motherName"
                      icon={<User className="w-3 h-3" />}
                      value={fields.motherName}
                      isEditing={isEditing}
                      onValueChange={handleFieldChange}
                      editable
                    />
                    <InfoCard
                      key="motherOccupation"
                      label="Occupation"
                      name="motherOccupation"
                      icon={<Briefcase className="w-3 h-3" />}
                      value={fields.motherOccupation}
                      isEditing={isEditing}
                      onValueChange={handleFieldChange}
                      editable
                    />

                    <InfoCard
                      key="motherEmail"
                      label="Email"
                      name="motherEmail"
                      type="email"
                      icon={<Mail className="w-3 h-3" />}
                      value={fields.motherEmail}
                      isEditing={isEditing}
                      onValueChange={handleFieldChange}
                      editable={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "permissions" && (
              <div className="space-y-8 pb-24 md:pb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <button
                    onClick={() => setRequestType("outing")}
                    disabled={user.has_pending_requests}
                    className="group relative overflow-hidden bg-white hover:bg-slate-900 rounded-xl p-6 transition-all duration-300 border border-slate-100 hover:border-slate-900 text-left disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md h-[120px] md:h-auto"
                  >
                    <div className="relative z-10 flex flex-col items-start h-full justify-between gap-4">
                      <div className="text-navy-900 group-hover:text-white transition-colors duration-300">
                        <Clock size={22} />
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-white mb-1 transition-colors leading-none">
                          Request Outing
                        </h3>
                        <p className="font-medium text-[12px] text-slate-400 group-hover:text-slate-500 transition-colors">
                          Short duration leaves
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setRequestType("outpass")}
                    disabled={user.has_pending_requests}
                    className="group relative overflow-hidden bg-white hover:bg-slate-900 rounded-xl p-6 transition-all duration-300 border border-slate-100 hover:border-slate-900 text-left disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md h-[120px] md:h-auto"
                  >
                    <div className="relative z-10 flex flex-col items-start h-full justify-between gap-4">
                      <div className="text-navy-900 group-hover:text-white transition-colors duration-300">
                        <Calendar size={22} />
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-white mb-1 transition-colors leading-none">
                          Request Outpass
                        </h3>
                        <p className="font-medium text-[12px] text-slate-400 group-hover:text-slate-500 transition-colors">
                          Overnight/Multi-day leaves
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <div>
                  <div className="text-slate-900">
                    <HistoryIcon size={18} />
                  </div>
                  <h3 className="text-[17px] font-semibold text-slate-900 tracking-tight">
                    Request History Audit
                  </h3>
                </div>

                <div className="space-y-3">
                  {isHistoryLoading ? (
                    <div className="text-center py-10 text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
                      Fetching Records...
                    </div>
                  ) : history.length > 0 ? (
                    <>
                      {history.map((req: any) => (
                        <RequestCard
                          key={req._id}
                          request={req}
                          type={req.type}
                        />
                      ))}
                      <Pagination
                        currentPage={historyPagination.page}
                        totalPages={historyPagination.totalPages}
                        onPageChange={(p) => fetchHistory(p)}
                        className="mt-6"
                      />
                    </>
                  ) : (
                    <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-slate-100">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 border border-slate-100 shadow-sm">
                        <HistoryIcon className="w-5 h-5 text-slate-200" />
                      </div>
                      <p className="text-slate-900 font-semibold text-sm uppercase tracking-wider">
                        No history found
                      </p>
                      <p className="text-slate-400 text-xs mt-1 font-medium">
                        Your past requests will appear here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Modals placed inside main content area to avoid z-index issues */}
        <AnimatePresence>
          {requestType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-xl p-6 md:p-10 max-w-lg w-full shadow-2xl overflow-hidden relative"
              >
                <div className="flex items-center gap-5 mb-8">
                  <div className="text-cyan-900">
                    {requestType === "outpass" ? (
                      <Calendar className="w-8 h-8" />
                    ) : (
                      <Clock className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold capitalize tracking-tight text-slate-900">
                      New {requestType} Snapshot
                    </h2>
                    <p className="text-[13px] font-medium text-slate-400">
                      Submit your leave authorization details
                    </p>
                  </div>
                </div>

                <form onSubmit={handleRequestSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                      Reason
                    </label>
                    <textarea
                      className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 focus:border-navy-100 focus:ring-1 focus:ring-navy-900 focus:outline-none min-h-[120px] font-bold text-[15px] text-slate-900 placeholder:text-slate-300 placeholder:font-normal resize-none transition-all"
                      placeholder="Please explain why you need to leave..."
                      value={requestForm.reason}
                      onChange={(e) =>
                        setRequestForm({
                          ...requestForm,
                          reason: e.target.value,
                        })
                      }
                      required
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                        From
                      </label>
                      <input
                        type={requestType === "outpass" ? "date" : "time"}
                        className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 focus:border-navy-100 focus:ring-1 focus:ring-navy-900 focus:outline-none font-semibold text-lg text-slate-900 transition-all"
                        value={requestForm.from}
                        onChange={(e) =>
                          setRequestForm({
                            ...requestForm,
                            from: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                        To
                      </label>
                      <input
                        type={requestType === "outpass" ? "date" : "time"}
                        className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 focus:border-navy-100 focus:ring-1 focus:ring-navy-900 focus:outline-none font-semibold text-lg text-slate-900 transition-all"
                        value={requestForm.to}
                        onChange={(e) =>
                          setRequestForm({ ...requestForm, to: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setRequestType(null)}
                      className="flex-1 h-[52px] font-bold text-sm text-slate-400 hover:text-slate-600 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={requestLoading}
                      className="flex-[2] h-[52px] bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-lg active:scale-[0.98]"
                    >
                      {requestLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        `Request ${requestType}`
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
