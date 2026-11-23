import { useState, useEffect, useCallback, useRef } from "react";
import { useRecoilValue } from "recoil";
import { useSearchParams } from "react-router-dom";
import { Camera, Loader2, Pencil } from "lucide-react";
import { student, studentProfileError } from "../../store";
import { useIsAuth } from "../../hooks/is_authenticated";
import { useStudentData } from "../../hooks/student_info";
import { apiClient } from "../../api/apiClient";
import { uploadImage } from "../../api/uploadImage";
import {
  UPDATE_DETAILS,
  STUDENT_HISTORY,
  REQUEST_OUTING,
  REQUEST_OUTPASS,
} from "../../api/endpoints";
import RequestCard from "../../components/RequestCard";
import { toast } from "@/utils/toast-ref";
import { Pagination } from "../../components/Pagination";
// WebSocket side channel not deployed — useStudentData polling handles refresh.
// import { useWebSocket } from "../../hooks/useWebSocket";
import { InfoCard } from "./components/InfoCard";
import AcademicRecord from "./components/AcademicRecord";
import ProfileSemesterSubjects from "./components/ProfileSemesterSubjects";
import SeatingArrangement, {
  fetchSeatingOnce,
} from "./components/SeatingArrangement";
import { Student } from "../../types";
import { enableOutingsAndOutpasses } from "@/config/featureFlags";
import { Button } from "@/components/Button";
import { Input, Textarea } from "../../components/Input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { InlineRetry, overviewSectionTitleClass } from "@/components/ui/overview";
import StudentHomeOverview from "./components/StudentHomeOverview";
import { Tabs } from "@/components/ui/tabs";

export { enableOutingsAndOutpasses } from "@/config/featureFlags";
const STUDENT_LOCKED_PROFILE_FIELDS = new Set([
  "name",
  "gender",
  "dateOfBirth",
]);

const sectionTitleClass =
  "font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head min-[821px]:text-h2 min-[821px]:leading-9";

// ─────────────────────────────────────────────────────────────────
// Profile Skeleton
// ─────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div
      className="space-y-4 rounded-xl border border-border bg-panel p-4 min-[640px]:p-6 min-[821px]:p-8"
      aria-busy="true"
    >
      {/* Absolute Decorative Icon Cloud (Expansive Backdrop) */}
      {/* Avatar + name skeleton */}
      {/* Avatar ring */}
      <span className="sr-only">Loading overview</span>
      <Skeleton className="h-6 w-2/5" />
      <div className="flex items-center gap-3">
        {/* Name */}
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      {/* Tab bar skeleton */}
      <Skeleton className="h-11 w-full" />
      {/* Info cards skeleton */}
      <div className="grid grid-cols-2 gap-4 min-[821px]:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

//
//
//

export default function StudentProfilePage() {
  useIsAuth();
  const { refetch } = useStudentData();
  const user = useRecoilValue<Student | any>(student);
  const profileError = useRecoilValue(studentProfileError);
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

  // WebSocket — disabled until a server-side side channel is deployed.
  // useWebSocket(undefined, (msg) => {
  //   if (msg.type === "REFRESH_REQUESTS" && msg.payload.userId === user?._id) {
  //     refetch();
  //     toast.info(`Request updated: ${msg.payload.status}`);
  //   }
  // });

  // Polling removed - now handled centrally in useStudentData hook

  // Helper to derive initial fields from user user object
  const getInitialFields = (userData: any) => {
    const genderMap: any = {
      Male: "M",
      Female: "F",
      M: "M",
      F: "F",
      Other: "Other",
    };
    return {
      name: userData?.name || "",
      gender: genderMap[userData?.gender] || userData?.gender || "",
      address: userData?.address || userData?.Address || "",
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
    };
  };

  // Init Data
  useEffect(() => {
    if (user?._id) {
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
      const uploadedUrl = await uploadImage(file, "student-profile");

      if (uploadedUrl) {
        // Only send profile_url - don't mix in personal fields
        const updateRes = await apiClient<any>(UPDATE_DETAILS, {
          method: "PUT",
          body: JSON.stringify({ profile_url: uploadedUrl }),
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
      if (STUDENT_LOCKED_PROFILE_FIELDS.has(key)) return;
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
      fetchSeatingOnce().then((result) => {
        if (!result.error) setSeating(result.seating);
        setLoading(false);
      });
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
      <div className="flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-dense font-medium text-text-2">Upcoming examination</p>
          <p className="mt-1 text-body font-medium text-head">{upcoming.subjectName}</p>
          <p className="mt-1 text-small text-text-2">
            {upcoming.examName} ·{" "}
            <span className="font-sans tabular-nums">
              {new Date(upcoming.date).toLocaleDateString("en-GB")}
            </span>
            {" · Hall "}
            <span className="font-sans tabular-nums">{upcoming.room}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setActiveTab("seating")}
        >
          View seating
        </Button>
      </div>
    );
  };

  const hasToken = !!localStorage.getItem("student_token");
  const userReady = Boolean(user?._id);
  const profileFailed = Boolean(hasToken && !userReady && profileError);

  const fullName = String(user?.name || "").trim();
  const firstName = fullName.split(/\s+/)[0] || fullName;
  const metaBits = [user?.branch, user?.year, user?.username].filter(Boolean);
  const sectionLabel = user?.section ? `Section ${user.section}` : "Section A";
  const roomLabel =
    user?.roomno && user.roomno !== "N/A" ? `Room ${user.roomno}` : "";
  const identityBits = [user?.username, sectionLabel, roomLabel].filter(Boolean);

  const bloodOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "N/A"].map(
    (v) => ({ v, l: v }),
  );
  const genderOptions = [
    { v: "M", l: "Male" },
    { v: "F", l: "Female" },
    { v: "Other", l: "Other" },
  ];

  const profileRows = [
    { label: "Name", name: "name", value: fields.name, editable: false },
    { label: "ID", name: "username", value: user?.username, editable: false },
    { label: "Branch", name: "branch", value: user?.branch, editable: false },
    {
      label: "Section",
      name: "section",
      value: user?.section || "A",
      editable: false,
    },
    {
      label: "Room",
      name: "roomno",
      value: user?.roomno || "N/A",
      editable: false,
    },
    {
      label: "Blood group",
      name: "bloodGroup",
      value: fields.bloodGroup,
      editable: true,
      type: "select",
      options: bloodOptions,
    },
    {
      label: "Phone",
      name: "phoneNumber",
      value: fields.phoneNumber,
      editable: true,
    },
    {
      label: "Gender",
      name: "gender",
      value: fields.gender,
      editable: false,
      type: "select",
      options: genderOptions,
    },
    {
      label: "Date of birth",
      name: "dateOfBirth",
      value: fields.dateOfBirth,
      editable: false,
      type: "date",
    },
    {
      label: "Address",
      name: "address",
      value: fields.address,
      editable: true,
      fullWidth: true,
    },
  ];

  const dashboardTabs = [
    { id: "personal", label: "Personal" },
    { id: "academic", label: "Academic" },
    /* "seating", */
    { id: "family", label: "Family" },
    ...(enableOutingsAndOutpasses
      ? [{ id: "permissions", label: "Permissions" }]
      : []),
  ];

  const cancelEdit = () => {
    setIsEditing(false);
    refetch();
  };

  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      {/* Actions - Top Right Absolute Position (Desktop Only) */}
      {/* Mobile Actions */}
      {isEditing ? (
        <>
          <Button type="button" variant="outline" onClick={cancelEdit}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            Save
          </Button>
        </>
      ) : (
        <>
          <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil size={16} strokeWidth={1.75} aria-hidden />
            Edit profile
          </Button>
          {enableOutingsAndOutpasses ? (
            <Button
              type="button"
              variant="primary"
              disabled={Boolean(user?.has_pending_requests)}
              onClick={() => setRequestType("outing")}
            >
              Request outing
            </Button>
          ) : null}
        </>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1120px] space-y-6 min-[640px]:px-2 min-[640px]:py-2 min-[821px]:space-y-8 min-[821px]:px-0 min-[821px]:py-0">
      {/* Absolute Decorative Icon Cloud (Expansive Backdrop) */}
      {/* Profile Header */}
      <PageHeader
        className={
          userReady
            ? "mb-0 max-[820px]:[&>div:last-child]:hidden"
            : "mb-0"
        }
        title={
          userReady ? (
            firstName ? `Welcome back, ${firstName}` : "Welcome back"
          ) : profileFailed ? (
            "Welcome back"
          ) : (
            <span className="inline-block h-8 w-2/3 animate-pulse rounded-md bg-tint align-middle motion-reduce:animate-none" />
          )
        }
        meta={
          userReady ? (
            metaBits.length ? metaBits.join(" · ") : undefined
          ) : profileFailed ? undefined : (
            <span className="mt-1 inline-block h-[18px] w-2/5 animate-pulse rounded-md bg-tint align-middle motion-reduce:animate-none" />
          )
        }
        action={userReady ? headerAction : undefined}
      />

      <StudentHomeOverview />

      {profileFailed ? (
        <InlineRetry
          title="Profile didn't load"
          body="Your details are unavailable right now."
          onRetry={() => refetch()}
        />
      ) : !userReady ? (
        <ProfileSkeleton />
      ) : (
        <Panel className="min-[640px]:p-6">
          <h2 className={overviewSectionTitleClass}>Your profile</h2>
          {/* Centered Avatar and Info */}
          <div className="mt-4 flex items-center gap-3">
            {/* Avatar with upload state */}
            <div className="relative h-14 w-14 shrink-0" aria-busy={isUploadingImage || undefined}>
              {/* Profile image or initial */}
              <Avatar
                size={56}
                src={user?.profile_url}
                alt={user?.name ? `${user.name} profile photo` : "Profile photo"}
                name={user?.name || "Student"}
              />
              {/* Dark blurry overlay - contained fully inside the circle */}
              {isUploadingImage ? (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-surface/80">
                  <Loader2 className="h-5 w-5 animate-spin text-head" aria-hidden />
                </span>
              ) : null}
              {/* Camera Icon Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                title="Update Profile Photo"
                aria-label="Update Profile Photo"
                className="absolute -bottom-1.5 -right-1.5 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text-2 hover:bg-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Camera className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-head [overflow-wrap:anywhere]">
                {user?.name || "Student"}
              </p>
              <p className="text-small text-text-3 [overflow-wrap:anywhere]">
                {identityBits.join(" · ")}
              </p>
              {/* Badges */}
              {user?.has_pending_requests ? (
                <div className="mt-2">
                  <Badge tone="warning">Pending action</Badge>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            {/* Tab Navigation */}
            <Tabs
              tabs={dashboardTabs}
              value={activeTab}
              onChange={setActiveTab}
              label="Profile sections"
            />
          </div>

          {/* Tab Content */}
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="mt-2"
          >
            {activeTab === "personal" && (
              <div>
                <dl className="grid grid-cols-2 gap-x-4 min-[821px]:grid-cols-3">
                  {profileRows.map((row) => (
                    <InfoCard
                      key={row.name}
                      {...row}
                      isEditing={isEditing}
                      isLoading={isLoading}
                      onValueChange={handleFieldChange}
                    />
                  ))}
                </dl>
                <SeatingSummaryWidget />
                {/* Modern Analytics Section integrated into Personal view */}
                {user?.username &&
                  /* <StudentAnalytics studentId={user.username} /> */
                  null}
              </div>
            )}

            {activeTab === "academic" && (
              <div className="space-y-8">
                {user?.username ? (
                  <ProfileSemesterSubjects studentId={user.username} />
                ) : null}
                {/* AcademicRecord will render its own grid/tables if data exists */}
                <AcademicRecord student={user} />
              </div>
            )}

            {activeTab === "seating" && <SeatingArrangement />}

            {activeTab === "family" && (
              <div className="grid gap-8 min-[821px]:grid-cols-2">
                <div>
                  <h2 className={sectionTitleClass}>Father&apos;s details</h2>
                  <dl className="mt-2">
                    <InfoCard
                      key="fatherName"
                      label="Name"
                      name="fatherName"
                      value={fields.fatherName}
                      isEditing={isEditing}
                      onValueChange={handleFieldChange}
                      editable
                    />
                    <InfoCard
                      key="fatherOccupation"
                      label="Occupation"
                      name="fatherOccupation"
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
                      value={fields.fatherEmail}
                      isEditing={isEditing}
                      onValueChange={handleFieldChange}
                      editable
                    />
                  </dl>
                </div>
                <div>
                  <h2 className={sectionTitleClass}>Mother&apos;s details</h2>
                  <dl className="mt-2">
                    <InfoCard
                      key="motherName"
                      label="Name"
                      name="motherName"
                      value={fields.motherName}
                      isEditing={isEditing}
                      onValueChange={handleFieldChange}
                      editable
                    />
                    <InfoCard
                      key="motherOccupation"
                      label="Occupation"
                      name="motherOccupation"
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
                      value={fields.motherEmail}
                      isEditing={isEditing}
                      onValueChange={handleFieldChange}
                      editable
                    />
                  </dl>
                </div>
              </div>
            )}

            {activeTab === "permissions" && (
              <div className="space-y-8">
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRequestType("outing")}
                    disabled={user.has_pending_requests}
                  >
                    Request outing
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRequestType("outpass")}
                    disabled={user.has_pending_requests}
                  >
                    Request outpass
                  </Button>
                </div>

                <h2 className={sectionTitleClass}>Request history</h2>

                {isHistoryLoading ? (
                  <div className="space-y-3" aria-hidden>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : history.length > 0 ? (
                  <>
                    <div>
                      {history.map((req: any) => (
                        <RequestCard key={req._id} request={req} type={req.type} />
                      ))}
                    </div>
                    <Pagination
                      currentPage={historyPagination.page}
                      totalPages={historyPagination.totalPages}
                      onPageChange={(p) => fetchHistory(p)}
                      className="mt-6"
                    />
                  </>
                ) : (
                  <EmptyState
                    title="No history found"
                    body="Your past requests will appear here."
                  />
                )}
              </div>
            )}
          </div>

          <div className="mt-4 min-[821px]:hidden">
            {isEditing ? (
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="primary"
                  isLoading={isSubmitting}
                  onClick={handleSubmit}
                >
                  Save
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={16} strokeWidth={1.75} aria-hidden />
                Edit profile
              </Button>
            )}
          </div>
        </Panel>
      )}

      {/* Modals placed inside main content area to avoid z-index issues */}
      {requestType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-request-title"
            className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-xl border border-border bg-panel p-6 min-[821px]:p-8"
          >
            <h2 id="leave-request-title" className={sectionTitleClass}>
              Request {requestType}
            </h2>
            <p className="mt-2 text-body text-text-2">
              Submit your leave authorization details
            </p>
            <form onSubmit={handleRequestSubmit} className="mt-6 space-y-4">
              <Textarea
                label="Reason"
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="From"
                  type={requestType === "outpass" ? "date" : "time"}
                  value={requestForm.from}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      from: e.target.value,
                    })
                  }
                  required
                />
                <Input
                  label="To"
                  type={requestType === "outpass" ? "date" : "time"}
                  value={requestForm.to}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, to: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRequestType(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={requestLoading}>
                  Submit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
