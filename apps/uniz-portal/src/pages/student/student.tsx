import { useState, useEffect, useCallback } from "react";
import { useRecoilValue } from "recoil";
import { useSearchParams } from "react-router-dom";
import {
  User,
  Droplets,
  Phone,
  Edit2,
  GraduationCap,
  IdCard,
  History,
  Clock,
  Calendar,
  MapPin,
  Mail,
  Briefcase,
  Award,
  LayoutGrid,
  Loader2,
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
} from "../../api/endpoints";
import { motion, AnimatePresence } from "framer-motion";
import RequestCard from "../../components/RequestCard";
import { toast } from "react-toastify";
import { Pagination } from "../../components/Pagination";
import { useWebSocket } from "../../hooks/useWebSocket";
import { InfoCard } from "./components/InfoCard";
import AcademicRecord from "./components/AcademicRecord";
import MySubjects from "./components/MySubjects";
import { Student } from "../../types";

export const enableOutingsAndOutpasses = true;

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

  // Init Data
  useEffect(() => {
    if (user && Object.keys(user).length > 0) {
      setFields({
        name: user.name || "",
        gender: user.gender || "",
        address: user.address || user.Address || "", // Handle different casing if any
        bloodGroup: user.blood_group || user.BloodGroup || "",
        phoneNumber: user.phone_number || user.PhoneNumber || "",
        dateOfBirth: user.date_of_birth
          ? new Date(user.date_of_birth).toISOString().split("T")[0]
          : "",
        fatherName: user.father_name || "",
        motherName: user.mother_name || "",
        fatherOccupation: user.father_occupation || "",
        motherOccupation: user.mother_occupation || "",
        fatherEmail: user.father_email || "",
        motherEmail: user.mother_email || "",
        fatherAddress: user.father_address || "",
        motherAddress: user.mother_address || "",
        fatherPhoneNumber: user.father_phonenumber || "",
        motherPhoneNumber: user.mother_phonenumber || "",
      });
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
  const handleFieldChange = useCallback((name: string, value: any) => {
    setFields((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e: any) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await apiClient<any>(UPDATE_DETAILS, {
        method: "PUT",
        body: JSON.stringify({ ...fields }),
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
      icon: <MapPin className="w-4 h-4" />,
      label: "Address",
      name: "address",
      editable: true,
      fullWidth: true,
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
    <div className="font-sans text-slate-900">
      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Profile Photo Removed */}

          <div className="flex-1 mb-0 md:mb-2 text-center md:text-left w-full md:w-auto">
            <p className="text-lg md:text-xl font-medium text-slate-400 mb-0.5">
              Welcome back,
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-slate-900 mb-2">
              {user?.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs md:text-sm font-medium text-slate-500">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-semibold uppercase tracking-widest text-[11px] bg-blue-50 border border-blue-100 px-2 py-1 rounded-full">
                  {user?.username}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="uppercase tracking-wide font-medium text-slate-700">
                  {user?.branch} - {user?.year}
                </span>
              </div>
              {user?.has_pending_requests && (
                <span className="text-blue-600 px-3 py-1 bg-blue-50 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 animate-pulse ml-1">
                  <Clock className="w-3 h-3" /> Pending Request
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 mb-0 md:mb-2 shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    refetch();
                  }}
                  className="uniz-primary-btn h-auto px-5 py-2 bg-white text-slate-600 border border-slate-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="uniz-primary-btn h-auto px-6 py-2"
                >
                  {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}{" "}
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="hidden md:flex uniz-primary-btn h-auto px-6 py-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white"
              >
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
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
              "family",
              enableOutingsAndOutpasses ? "permissions" : "",
            ]
              .filter(Boolean)
              .map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab || "personal")}
                  className={`pb-3 relative text-[11px] font-semibold uppercase tracking-[0.15em] transition-all ${
                    activeTab === tab
                      ? "text-blue-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full"
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
            )}

            {activeTab === "academic" && (
              <div className="space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-1.5 bg-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold tracking-tight uppercase text-slate-800">
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
              <MySubjects studentId={user?._id || user?.username} />
            )}

            {activeTab === "family" && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <h3 className="text-lg font-bold text-slate-800">
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
                      key="fatherPhoneNumber"
                      label="Phone"
                      name="fatherPhoneNumber"
                      icon={<Phone className="w-3 h-3" />}
                      value={fields.fatherPhoneNumber}
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
                      editable
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <h3 className="text-lg font-bold text-slate-800">
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
                      key="motherPhoneNumber"
                      label="Phone"
                      name="motherPhoneNumber"
                      icon={<Phone className="w-3 h-3" />}
                      value={fields.motherPhoneNumber}
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
                      editable
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "permissions" && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  <button
                    onClick={() => setRequestType("outing")}
                    disabled={user.has_pending_requests}
                    className="group relative overflow-hidden bg-white hover:bg-blue-600 rounded-2xl p-6 transition-all duration-300 border border-slate-100 hover:border-blue-600 text-left disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-xl"
                  >
                    <div className="relative z-10 flex flex-col items-start h-full justify-between gap-4">
                      <div className="text-blue-500 group-hover:text-white transition-colors duration-300">
                        <Clock className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-[17px] font-semibold text-slate-900 group-hover:text-white mb-1 transition-colors">
                          Request Outing
                        </h3>
                        <p className="font-medium text-[13px] text-slate-500 group-hover:text-blue-100 transition-colors">
                          Short duration leaves (few hours)
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setRequestType("outpass")}
                    disabled={user.has_pending_requests}
                    className="group relative overflow-hidden bg-white hover:bg-blue-600 rounded-2xl p-6 transition-all duration-300 border border-slate-100 hover:border-blue-600 text-left disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-xl"
                  >
                    <div className="relative z-10 flex flex-col items-start h-full justify-between gap-4">
                      <div className="text-blue-500 group-hover:text-white transition-colors duration-300">
                        <Calendar className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-[17px] font-semibold text-slate-900 group-hover:text-white mb-1 transition-colors">
                          Request Outpass
                        </h3>
                        <p className="font-medium text-[13px] text-slate-500 group-hover:text-blue-100 transition-colors">
                          Long duration leaves (overnight/days)
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-blue-600">
                      <History className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">
                      Request History
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {isHistoryLoading ? (
                      <div className="text-center py-10 text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
                        Fetching Records...
                      </div>
                    ) : history.length > 0 ? (
                      <>
                        {history.map((req) => (
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
                      <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 border border-slate-100 shadow-sm">
                          <History className="w-5 h-5 text-slate-200" />
                        </div>
                        <p className="text-slate-900 font-black text-sm uppercase tracking-wider">
                          No history found
                        </p>
                        <p className="text-slate-400 text-xs mt-1 font-medium">
                          Your past requests will appear here
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Modals placed inside main content area to avoid z-index issues, or can be outside. keeping existing loop logic */}
        <AnimatePresence>
          {/* ... (Existing modals logic) keeping same structure just shifting indentation logic implicitly by nesting */}
          {requestType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[40px] p-6 md:p-10 max-w-lg w-full shadow-2xl overflow-hidden relative"
              >
                <div className="flex items-center gap-5 mb-8">
                  <div className="text-blue-600">
                    {requestType === "outpass" ? (
                      <Calendar className="w-8 h-8" />
                    ) : (
                      <Clock className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black capitalize tracking-tight text-slate-900">
                      New {requestType}
                    </h2>
                    <p className="text-sm font-medium text-slate-500">
                      Submit your request details below.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleRequestSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                      Reason
                    </label>
                    <textarea
                      className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none min-h-[120px] font-bold text-[15px] text-slate-900 placeholder:text-slate-300 placeholder:font-normal resize-none transition-all"
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
                        className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-bold text-lg text-slate-900 transition-all"
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
                        className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-bold text-lg text-slate-900 transition-all"
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
                      className="flex-1 uniz-primary-btn bg-white text-slate-400 border border-slate-200 shadow-none hover:shadow-none hover:bg-slate-50 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={requestLoading}
                      className="flex-[2] uniz-primary-btn"
                    >
                      {requestLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Submit Request"
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Closing divs for the standard layout */}
      </div>
    </div>
  );
}
