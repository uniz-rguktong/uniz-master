"use client";

import { useState, useEffect, use } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
  IndianRupee,
  CalendarDays,
  MapPin,
  Users,
  User,
  Plus,
  X,
  UserPlus,
  CheckCircle2,
  Trash2,
  Eye,
  Pencil,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import {
  getCoordinatorEventDetails,
  type CoordinatorEventDetails,
} from "@/actions/coordinatorGetters";
import {
  createCoordinatorOfflineIndividualRegistration,
  createCoordinatorOfflineTeamRegistration,
  updateCoordinatorOfflineTeamRegistration,
  getRecentOfflineRegistrationsV2,
  deleteCoordinatorRegistration,
  updateCoordinatorOfflineRegistration,
} from "@/actions/coordinatorRegistrationActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import Link from "next/link";

interface OfflineRegistrationPageProps {
  params: Promise<{ id: string }>;
}

type TeamMemberField = {
  name: string;
  rollNumber: string;
  email: string;
  phone: string;
  department: string;
  year: string;
  role: "Captain" | "Vice Captain" | "Member";
};

const sortTeamMembersInRegisteredOrder = (members: any[] = []) => {
  return [...members].sort((a, b) => {
    const roleA = String(a?.role || "").toUpperCase();
    const roleB = String(b?.role || "").toUpperCase();

    const isLeaderA = roleA === "LEADER" || roleA === "CAPTAIN";
    const isLeaderB = roleB === "LEADER" || roleB === "CAPTAIN";

    if (isLeaderA !== isLeaderB) return isLeaderA ? -1 : 1;

    const joinedA = a?.joinedAt ? new Date(a.joinedAt).getTime() : 0;
    const joinedB = b?.joinedAt ? new Date(b.joinedAt).getTime() : 0;
    if (joinedA !== joinedB) return joinedA - joinedB;

    return String(a?.id || "").localeCompare(String(b?.id || ""));
  });
};

export default function OfflineRegistrationPage({
  params,
}: OfflineRegistrationPageProps) {
  const { id: eventId } = use(params);
  const { showToast } = useToast();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [eventDetails, setEventDetails] =
    useState<CoordinatorEventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "BANK">(
    "CASH",
  );
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewRegistration, setViewRegistration] = useState<any | null>(null);
  const [editRegistration, setEditRegistration] = useState<any | null>(null);
  const [isUpdatingRegistration, setIsUpdatingRegistration] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<any | null>(
    null,
  );
  const [isDeletingRegistration, setIsDeletingRegistration] = useState(false);
  const [editForm, setEditForm] = useState<any>({
    teamName: "",
    studentName: "",
    studentId: "",
    email: "",
    phone: "",
    year: "",
    status: "CONFIRMED",
    amount: "",
    members: [
      {
        name: "",
        rollNumber: "",
        email: "",
        phone: "",
        department: "",
        year: "",
        role: "Captain" as const,
      },
    ],
  });

  const isTeamRegistrationType = (value: string | null | undefined) => {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();
    return normalized === "team" || normalized.includes("team");
  };

  const getParticipationTypeLabel = (value: string | null | undefined) => {
    return isTeamRegistrationType(value) ? "Team" : "Individual";
  };

  const normalizeEditRole = (role: any): TeamMemberField["role"] => {
    if (role === "LEADER" || role === "Captain") return "Captain";
    if (role === "VICE_CAPTAIN" || role === "Vice Captain")
      return "Vice Captain";
    return "Member";
  };

  // Individual form
  const individualForm = useForm({
    defaultValues: {
      studentName: "",
      studentId: "",
      year: "",
      email: "",
      phone: "",
      paymentStatus: "PAID",
      amount: 0,
    },
  });

  // Team form
  const teamForm = useForm<{
    teamName: string;
    paymentStatus: string;
    amount: number;
    members: TeamMemberField[];
  }>({
    defaultValues: {
      teamName: "",
      paymentStatus: "PAID",
      amount: 0,
      members: [
        {
          name: "",
          rollNumber: "",
          email: "",
          phone: "",
          department: "",
          year: "",
          role: "Captain" as const,
        },
      ],
    },
  });

  const {
    fields: memberFields,
    append: addMember,
    remove: removeMember,
  } = useFieldArray({
    control: teamForm.control,
    name: "members",
  });

  const paymentStatusIndividual = individualForm.watch("paymentStatus");
  const paymentStatusTeam = teamForm.watch("paymentStatus");

  const isEventFree =
    eventDetails &&
    (eventDetails.fee === "Free" ||
      eventDetails.fee === "0" ||
      !eventDetails.isPaid);
  const participationTypeLabel = getParticipationTypeLabel(
    eventDetails?.eventType,
  );

  const formatCardDate = (dateValue: string | Date) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
      .format(new Date(dateValue))
      .replace(/\//g, " / ");
  };

  useEffect(() => {
    async function loadEvent() {
      setIsLoading(true);
      const res = await getCoordinatorEventDetails(eventId);
      if (res.success && res.event) {
        setEventDetails(res.event);

        // Set default values based on event
        const fee = parseFloat(String(res.event.fee)) || 0;
        const free =
          res.event.fee === "Free" ||
          res.event.fee === "0" ||
          !res.event.isPaid;

        individualForm.setValue("amount", fee);
        teamForm.setValue("amount", fee);

        if (free) {
          individualForm.setValue("paymentStatus", "PAID");
          teamForm.setValue("paymentStatus", "PAID");
        }

        // Default payment mode based on event gateway
        if (res.event.paymentGateway === "UPI") {
          setPaymentMode("UPI");
        } else if (res.event.paymentGateway === "Net Banking") {
          setPaymentMode("BANK");
        }

        // Set minimum team members if team event
        if (
          isTeamRegistrationType(res.event.eventType) &&
          res.event.teamSizeMin &&
          res.event.teamSizeMin > 1
        ) {
          const currentMembers = teamForm.getValues("members");
          const membersToAdd = res.event.teamSizeMin - currentMembers.length;
          for (let i = 0; i < membersToAdd; i++) {
            addMember({
              name: "",
              rollNumber: "",
              email: "",
              phone: "",
              department: "",
              year: "",
              role: "Member" as const,
            });
          }
        }
        setLoadError(null);
      } else {
        setLoadError(res.error || "Failed to load event details");
      }
      setIsLoading(false);
    }
    loadEvent();
  }, [eventId, addMember, individualForm, teamForm]);

  const fetchRecent = async () => {
    setIsRefreshing(true);
    const res = await getRecentOfflineRegistrationsV2(eventId);
    if (
      res &&
      "success" in res &&
      res.success &&
      "registrations" in res &&
      res.registrations
    ) {
      const orderedRegistrations = [...(res as any).registrations].sort(
        (a: any, b: any) => {
          const timeDiff =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          if (timeDiff !== 0) return timeDiff;
          return String(a.id || "").localeCompare(String(b.id || ""));
        },
      );

      setRecentRegistrations(orderedRegistrations);
      setSuccessCount(orderedRegistrations.length);
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (eventId) fetchRecent();
  }, [eventId]);

  const handleDelete = async (id: string) => {
    setIsDeletingRegistration(true);
    const res = await deleteCoordinatorRegistration(id);
    if (res.success) {
      showToast(res.message || "Entry deleted", "success");
      await fetchRecent();
    } else {
      showToast(res.error || "Failed to delete", "error");
    }
    setIsDeletingRegistration(false);
    setRegistrationToDelete(null);
  };

  const requestDelete = (registration: any) => {
    setRegistrationToDelete(registration);
  };

  const openViewRegistration = (registration: any) => {
    setViewRegistration(registration);
  };

  const openEditRegistration = (registration: any) => {
    const orderedMembers = registration.team?.members?.length
      ? sortTeamMembersInRegisteredOrder(registration.team.members)
      : [
          {
            name: registration.studentName || "",
            rollNumber: registration.studentId || "",
            email: registration.email || "",
            phone: registration.phone || "",
            department: registration.branch || "",
            year: registration.year || "",
            role: "Captain",
          },
        ];

    const mappedMembers: TeamMemberField[] = orderedMembers.map(
      (member: any) => ({
        name: member.name || "",
        rollNumber: member.rollNumber || "",
        email: member.email || "",
        phone: member.phone || "",
        department: member.department || "",
        year: member.year || "",
        role: normalizeEditRole(member.role),
      }),
    );

    setEditRegistration(registration);
    setEditForm({
      teamName: registration.team?.teamName || "",
      studentName: registration.studentName || "",
      studentId: registration.studentId || "",
      email: registration.email || "",
      phone: registration.phone || "",
      year: registration.year || "",
      status:
        registration.status === "PENDING"
          ? "WAITLISTED"
          : registration.status || "CONFIRMED",
      amount: registration.amount ?? "",
      members: mappedMembers,
    });
  };

  const updateEditMember = (
    index: number,
    key: keyof TeamMemberField,
    value: string,
  ) => {
    setEditForm((prev: any) => ({
      ...prev,
      members: (prev.members || []).map(
        (member: TeamMemberField, memberIndex: number) =>
          memberIndex === index ? { ...member, [key]: value } : member,
      ),
    }));
  };

  const addEditMember = () => {
    setEditForm((prev: any) => ({
      ...prev,
      members: [
        ...(prev.members || []),
        {
          name: "",
          rollNumber: "",
          email: "",
          phone: "",
          department: "",
          year: "",
          role: "Member" as const,
        },
      ],
    }));
  };

  const removeEditMember = (index: number) => {
    setEditForm((prev: any) => {
      const members = [...(prev.members || [])];
      members.splice(index, 1);
      return {
        ...prev,
        members:
          members.length > 0
            ? members
            : [
                {
                  name: "",
                  rollNumber: "",
                  email: "",
                  phone: "",
                  department: "",
                  year: "",
                  role: "Captain" as const,
                },
              ],
      };
    });
  };

  const handleSaveEditedRegistration = async () => {
    if (!editRegistration) return;
    setIsUpdatingRegistration(true);

    if (editRegistration.team) {
      const members: TeamMemberField[] = (editForm.members || []).map(
        (m: TeamMemberField) => ({
          name: (m.name || "").trim(),
          rollNumber: (m.rollNumber || "").trim().toUpperCase(),
          email: (m.email || "").trim(),
          phone: (m.phone || "").trim(),
          department: (m.department || "").trim(),
          year: (m.year || "").trim(),
          role: m.role,
        }),
      );

      if (!editForm.teamName?.trim()) {
        showToast("Team name is required", "error");
        setIsUpdatingRegistration(false);
        return;
      }

      if (
        members.length === 0 ||
        members.some((m) => !m.name || !m.rollNumber)
      ) {
        showToast("Each team member must have name and roll number", "error");
        setIsUpdatingRegistration(false);
        return;
      }

      const captainCount = members.filter((m) => m.role === "Captain").length;
      if (captainCount !== 1) {
        showToast("Exactly one captain is required", "error");
        setIsUpdatingRegistration(false);
        return;
      }

      const teamRes = await updateCoordinatorOfflineTeamRegistration({
        registrationId: editRegistration.id,
        eventId,
        teamName: editForm.teamName,
        members,
      });

      if (!teamRes.success) {
        showToast(
          teamRes.error || "Failed to update team registration",
          "error",
        );
        setIsUpdatingRegistration(false);
        return;
      }

      const captain = members.find((m) => m.role === "Captain") || members[0];
      if (!captain) {
        showToast("Captain details are required", "error");
        setIsUpdatingRegistration(false);
        return;
      }

      const paymentPayload: any = {
        registrationId: editRegistration.id,
        eventId,
        teamName: editForm.teamName,
        studentName: captain.name,
        studentId: captain.rollNumber,
        amount: editForm.amount || 0,
      };

      if (captain.email) paymentPayload.email = captain.email;
      if (captain.phone) paymentPayload.phone = captain.phone;
      if (captain.year) paymentPayload.year = captain.year;
      if (editForm.status) paymentPayload.status = editForm.status;

      const paymentRes =
        await updateCoordinatorOfflineRegistration(paymentPayload);

      if (!paymentRes.success) {
        showToast(
          paymentRes.error ||
            "Team updated, but failed to update payment details",
          "error",
        );
        setIsUpdatingRegistration(false);
        return;
      }

      showToast("Registration updated successfully", "success");
    } else {
      if (!editForm.studentName?.trim() || !editForm.studentId?.trim()) {
        showToast("Student name and ID are required", "error");
        setIsUpdatingRegistration(false);
        return;
      }

      const payload: any = {
        registrationId: editRegistration.id,
        eventId,
        studentName: editForm.studentName,
        studentId: editForm.studentId,
        amount: editForm.amount || 0,
      };

      if (editForm.email) payload.email = editForm.email;
      if (editForm.phone) payload.phone = editForm.phone;
      if (editForm.year) payload.year = editForm.year;
      if (editForm.status) payload.status = editForm.status;

      const res = await updateCoordinatorOfflineRegistration(payload);

      if (!res.success) {
        showToast(res.error || "Failed to update registration", "error");
        setIsUpdatingRegistration(false);
        return;
      }

      showToast(res.message || "Registration updated successfully", "success");
    }

    setEditRegistration(null);
    await fetchRecent();
    setIsUpdatingRegistration(false);
  };

  // Individual submit
  const onIndividualSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createCoordinatorOfflineIndividualRegistration({
        eventId,
        studentName: data.studentName,
        studentId: data.studentId,
        year: data.year || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        amount: parseFloat(data.amount),
        paymentStatus: data.paymentStatus,
        // Append payment mode to metadata internally or transaction ID if needed
        // For now, we'll keep the standard schema
      });

      if (result.success) {
        showToast(
          result.message || "Registration added successfully!",
          "success",
        );
        fetchRecent(); // Refresh list
        individualForm.reset({
          studentName: "",
          studentId: "",
          year: "",
          email: "",
          phone: "",
          paymentStatus: isEventFree ? "PAID" : "PAID",
          amount: parseFloat(String(eventDetails?.fee)) || 0,
        });
      } else {
        setSubmitError(result.error || "Failed to create registration");
      }
    } catch (err) {
      setSubmitError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Team submit
  const onTeamSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmitError(null);
    if (!eventDetails) return;
    try {
      // Validate team size
      if (
        eventDetails.teamSizeMin &&
        data.members.length < eventDetails.teamSizeMin
      ) {
        setSubmitError(
          `Team must have at least ${eventDetails.teamSizeMin} members`,
        );
        setIsSubmitting(false);
        return;
      }
      if (
        eventDetails.teamSizeMax &&
        data.members.length > eventDetails.teamSizeMax
      ) {
        setSubmitError(
          `Team cannot have more than ${eventDetails.teamSizeMax} members`,
        );
        setIsSubmitting(false);
        return;
      }

      const result = await createCoordinatorOfflineTeamRegistration({
        eventId,
        teamName: data.teamName,
        members: data.members.map((m: TeamMemberField) => ({
          name: m.name,
          rollNumber: m.rollNumber,
          email: m.email || undefined,
          phone: m.phone || undefined,
          department: m.department || undefined,
          year: m.year || undefined,
          role: m.role,
        })),
        amount: parseFloat(data.amount),
        paymentStatus: data.paymentStatus,
      });

      if (result.success) {
        showToast(result.message || "Team registered successfully!", "success");
        fetchRecent(); // Refresh list
        teamForm.reset({
          teamName: "",
          paymentStatus: isEventFree ? "PAID" : "PAID",
          amount: parseFloat(String(eventDetails.fee)) || 0,
          members: Array(eventDetails.teamSizeMin || 1)
            .fill(null)
            .map((_: any, i: any) => ({
              name: "",
              rollNumber: "",
              email: "",
              phone: "",
              department: "",
              year: "",
              role: (i === 0 ? "Captain" : "Member") as any,
            })),
        });
      } else {
        setSubmitError(result.error || "Failed to register team");
      }
    } catch (err) {
      setSubmitError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#1A1A1A]" />
          <p className="text-gray-500 font-medium">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (loadError || !eventDetails) {
    return (
      <div className="flex h-[60vh] items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-[#EF4444] mb-4" />
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">
            Event Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {loadError ||
              "We couldn't find the event or you don't have permission."}
          </p>
          <Link
            href="/coordinator"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#2D2D2D] transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 animate-page-entrance max-w-[1200px] mx-auto">
      <div className="mb-8">
        <Link
          href="/coordinator"
          className="inline-flex items-center gap-2 text-sm text-[#6B7280] mb-3 hover:text-[#1A1A1A] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A]">
                {eventDetails.title}
              </h1>
              <span className="px-2.5 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#E5E7EB]">
                Offline Registration
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B7280]">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-[#9CA3AF]" />
                {formatCardDate(eventDetails.date)}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#9CA3AF]" />
                {eventDetails.venue}
              </div>
              <div className="flex items-center gap-1.5 border-l border-[#E5E7EB] pl-4">
                <span
                  className={`font-bold ${isEventFree ? "text-[#10B981]" : "text-orange-500"}`}
                >
                  {isEventFree ? "FREE EVENT" : `₹${eventDetails.fee}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Metrics row for offline registrations */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
              <div className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mb-1">
                Total Offline
              </div>
              <div className="text-2xl font-bold text-[#1A1A1A]">
                {successCount}
              </div>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
              <div className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mb-1">
                Registration Type
              </div>
              <div className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wide">
                {participationTypeLabel}
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[22px] p-6 md:p-8 shadow-sm">
            {submitError && (
              <div className="mb-6 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-center gap-3 text-[#EF4444]">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-semibold">{submitError}</p>
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-[#1A1A1A]">Entry Form</h2>
            </div>

            {isTeamRegistrationType(eventDetails.eventType) ? (
              <form
                onSubmit={teamForm.handleSubmit(onTeamSubmit)}
                className="space-y-6"
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">
                        Team Name <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        {...teamForm.register("teamName", { required: true })}
                        placeholder="Team Name"
                        className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">
                        Leader <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        {...teamForm.register("members.0.name" as const, {
                          required: "Leader name is required",
                        })}
                        placeholder="Leader Name"
                        className={`w-full h-11 px-4 rounded-lg border text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none ${teamForm.formState.errors.members?.[0]?.name ? "border-red-500 bg-red-50" : "border-[#E5E7EB] bg-white"}`}
                      />
                      {teamForm.formState.errors.members?.[0]?.name && (
                        <p className="text-[10px] text-red-500 font-bold ml-1">
                          {String(
                            teamForm.formState.errors.members[0]?.name
                              ?.message || "Leader name is required",
                          )}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">
                        Leader Email
                      </label>
                      <input
                        {...teamForm.register("members.0.email" as const, {
                          pattern: {
                            value: /^\S+@\S+\.\S+$/,
                            message: "Enter a valid email address",
                          },
                        })}
                        type="email"
                        placeholder="leader@example.com"
                        className={`w-full h-11 px-4 rounded-lg border text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none ${teamForm.formState.errors.members?.[0]?.email ? "border-red-500 bg-red-50" : "border-[#E5E7EB] bg-white"}`}
                      />
                      {teamForm.formState.errors.members?.[0]?.email && (
                        <p className="text-[10px] text-red-500 font-bold ml-1">
                          {String(
                            teamForm.formState.errors.members[0]?.email
                              ?.message || "Enter a valid email address",
                          )}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">
                        Event
                      </label>
                      <input
                        value={eventDetails.title}
                        readOnly
                        className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm font-medium text-[#374151]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">
                        Status
                      </label>
                      <input
                        value="Confirmed"
                        readOnly
                        className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm font-medium text-[#374151]"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[#F3F4F6]">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                        Members ({memberFields.length})
                      </label>
                      {(eventDetails.teamSizeMax === null ||
                        memberFields.length < eventDetails.teamSizeMax) && (
                        <button
                          type="button"
                          onClick={() =>
                            addMember({
                              name: "",
                              rollNumber: "",
                              email: "",
                              phone: "",
                              department: "",
                              year: "",
                              role: "Member" as const,
                            })
                          }
                          className="h-9 px-3 flex items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F7F8FA] text-[11px] font-bold uppercase tracking-wider transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Member
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {memberFields.map((field: any, index: any) => (
                        <div
                          key={field.id}
                          className="relative p-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB]"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black bg-[#F3F4F6] px-2 py-0.5 rounded text-[#6B7280]">
                              {index === 0 ? "LEADER" : `MEMBER ${index + 1}`}
                            </span>
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const minSize = eventDetails.teamSizeMin || 1;
                                  if (memberFields.length <= minSize) return;
                                  removeMember(index);
                                }}
                                disabled={
                                  memberFields.length <=
                                  (eventDetails.teamSizeMin || 1)
                                }
                                className="h-8 px-2.5 rounded-lg border border-[#FECACA] text-[#EF4444] hover:bg-[#FEF2F2] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all"
                              >
                                <X className="w-4 h-4" />
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <input
                                {...teamForm.register(
                                  `members.${index}.name` as const,
                                  { required: "Name is required" },
                                )}
                                placeholder="Student Name"
                                className={`w-full h-10 px-3 rounded-lg border text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none ${teamForm.formState.errors.members?.[index]?.name ? "border-red-500 bg-red-50" : "border-[#E5E7EB]"}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <input
                                {...teamForm.register(
                                  `members.${index}.rollNumber` as const,
                                  { required: "ID is required" },
                                )}
                                placeholder="Roll Number"
                                className={`w-full h-10 px-3 rounded-lg border text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none uppercase ${teamForm.formState.errors.members?.[index]?.rollNumber ? "border-red-500 bg-red-50" : "border-[#E5E7EB]"}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <input
                                {...teamForm.register(
                                  `members.${index}.phone` as const,
                                  {
                                    required: "Phone number is required",
                                    pattern: {
                                      value: /^[0-9]{10}$/,
                                      message:
                                        "Enter a valid 10-digit phone number",
                                    },
                                  },
                                )}
                                placeholder="Phone Number (10 digits)"
                                type="tel"
                                className={`w-full h-10 px-3 rounded-lg border text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none ${teamForm.formState.errors.members?.[index]?.phone ? "border-red-500 bg-red-50" : "border-[#E5E7EB]"}`}
                              />
                              {teamForm.formState.errors.members?.[index]
                                ?.phone && (
                                <p className="text-[10px] text-red-500 font-bold ml-1">
                                  {
                                    teamForm.formState.errors.members[index]
                                      ?.phone?.message
                                  }
                                </p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <input
                                {...teamForm.register(
                                  `members.${index}.email` as const,
                                  {
                                    pattern: {
                                      value: /^\S+@\S+\.\S+$/,
                                      message: "Enter a valid email address",
                                    },
                                  },
                                )}
                                type="email"
                                placeholder="Email (optional)"
                                className={`w-full h-10 px-3 rounded-lg border text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none ${teamForm.formState.errors.members?.[index]?.email ? "border-red-500 bg-red-50" : "border-[#E5E7EB]"}`}
                              />
                              {teamForm.formState.errors.members?.[index]
                                ?.email && (
                                <p className="text-[10px] text-red-500 font-bold ml-1">
                                  {String(
                                    teamForm.formState.errors.members[index]
                                      ?.email?.message ||
                                      "Enter a valid email address",
                                  )}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <Controller
                                control={teamForm.control}
                                name={`members.${index}.year` as const}
                                rules={{
                                  required:
                                    index === 0 ? "Year is required" : false,
                                }}
                                render={({ field }) => (
                                  <Select
                                    value={field.value || ""}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger
                                      className={`w-full h-10 border text-sm font-medium ${teamForm.formState.errors.members?.[index]?.year ? "border-red-500 bg-red-50" : "border-[#E5E7EB] bg-white"}`}
                                    >
                                      <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="I Year">
                                        I Year
                                      </SelectItem>
                                      <SelectItem value="II Year">
                                        II Year
                                      </SelectItem>
                                      <SelectItem value="III Year">
                                        III Year
                                      </SelectItem>
                                      <SelectItem value="IV Year">
                                        IV Year
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              {teamForm.formState.errors.members?.[index]
                                ?.year && (
                                <p className="text-[10px] text-red-500 font-bold ml-1">
                                  {String(
                                    teamForm.formState.errors.members[index]
                                      ?.year?.message || "Year is required",
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                          {index === 0 && (
                            <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3" /> TEAM LEADER
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] text-[#9CA3AF] font-medium">
                      Minimum members: {eventDetails.teamSizeMin || 1}
                      {eventDetails.teamSizeMax
                        ? ` • Maximum members: ${eventDetails.teamSizeMax}`
                        : ""}
                    </p>
                  </div>
                </div>

                {!isEventFree && (
                  <PaymentSection
                    register={teamForm.register}
                    paymentStatus={paymentStatusTeam}
                    eventFee={eventDetails.fee}
                    paymentMode={paymentMode}
                    setPaymentMode={setPaymentMode}
                  />
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#1A1A1A] text-white rounded-lg font-bold text-sm hover:bg-[#2D2D2D] disabled:opacity-50 transition-all shadow-md shadow-gray-200 mt-6"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    "Complete Registration"
                  )}
                </button>
              </form>
            ) : (
              <form
                onSubmit={individualForm.handleSubmit(onIndividualSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">
                      Registration ID
                    </label>
                    <input
                      value="Auto Generated"
                      readOnly
                      className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm font-medium text-[#374151]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">
                      Event Date
                    </label>
                    <input
                      value={formatCardDate(eventDetails.date)}
                      readOnly
                      className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm font-medium text-[#374151]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">
                      Event
                    </label>
                    <input
                      value={eventDetails.title}
                      readOnly
                      className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm font-medium text-[#374151]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">
                      Status
                    </label>
                    <input
                      value="Confirmed"
                      readOnly
                      className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm font-medium text-[#374151]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">
                      Student Name <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      {...individualForm.register("studentName", {
                        required: true,
                      })}
                      placeholder="Full Name"
                      className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">
                      Roll Number <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      {...individualForm.register("studentId", {
                        required: true,
                      })}
                      placeholder="Student ID"
                      className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">
                      Year <span className="text-[#EF4444]">*</span>
                    </label>
                    <Controller
                      control={individualForm.control}
                      name="year"
                      rules={{ required: "Year is required" }}
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            className={`w-full h-11 border text-sm font-medium ${individualForm.formState.errors.year ? "border-red-500 bg-red-50" : "border-[#E5E7EB] bg-white"}`}
                          >
                            <SelectValue placeholder="Select Year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="I Year">I Year</SelectItem>
                            <SelectItem value="II Year">II Year</SelectItem>
                            <SelectItem value="III Year">III Year</SelectItem>
                            <SelectItem value="IV Year">IV Year</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {individualForm.formState.errors.year && (
                      <p className="text-[10px] text-red-500 font-bold ml-1">
                        {String(
                          individualForm.formState.errors.year.message ||
                            "Year is required",
                        )}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">
                      Email
                    </label>
                    <input
                      {...individualForm.register("email")}
                      placeholder="Optional"
                      className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest ml-1">
                      Phone <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      {...individualForm.register("phone", {
                        required: "Phone number is required",
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: "Enter a valid 10-digit phone number",
                        },
                      })}
                      type="tel"
                      placeholder="10-digit number"
                      className={`w-full h-11 px-4 rounded-lg border text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none ${individualForm.formState.errors.phone ? "border-red-500 bg-red-50" : "border-[#E5E7EB]"}`}
                    />
                    {individualForm.formState.errors.phone && (
                      <p className="text-[10px] text-red-500 font-bold ml-1">
                        {individualForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                {!isEventFree && (
                  <PaymentSection
                    register={individualForm.register}
                    paymentStatus={paymentStatusIndividual}
                    eventFee={eventDetails.fee}
                    paymentMode={paymentMode}
                    setPaymentMode={setPaymentMode}
                  />
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#1A1A1A] text-white rounded-lg font-bold text-sm hover:bg-[#2D2D2D] disabled:opacity-50 transition-all shadow-md mt-4"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    "Submit Registration"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#1A1A1A] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1A1A1A]" />
                Recent Entries
              </h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {recentRegistrations.length} Added
              </span>
            </div>

            {recentRegistrations.length === 0 ? (
              <div className="py-8 text-center bg-[#F9FAFB] rounded-xl border border-dashed border-[#E5E7EB]">
                <User className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2 opacity-20" />
                <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest">
                  No entries yet
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {recentRegistrations.map((reg: any) => (
                  <div
                    key={reg.id}
                    className="p-3 bg-white border border-[#F3F4F6] rounded-xl hover:border-[#1A1A1A]/10 transition-all group relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#1A1A1A] truncate pr-6">
                          {reg.team ? reg.team.teamName : reg.studentName}
                        </div>
                        <div className="text-[10px] text-[#6B7280] font-medium mt-0.5">
                          {reg.studentId} •{" "}
                          {new Date(reg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                              reg.status === "CONFIRMED" ||
                              reg.status === "ATTENDED"
                                ? "bg-emerald-50 text-emerald-600"
                                : reg.status === "WAITLISTED"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {reg.status === "WAITLISTED"
                              ? "WAITLIST"
                              : reg.status}
                          </span>
                          <span className="text-[8px] font-bold text-gray-400">
                            ₹{reg.amount}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openViewRegistration(reg)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Registration Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditRegistration(reg)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Edit Registration"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => requestDelete(reg)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-6">
            <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#1A1A1A]" />
              Guidelines
            </h3>
            <ul className="space-y-3">
              {[
                "Ensure roll numbers are accurate.",
                "Verify identification for fee collection.",
                "Confirm attendee mobile number.",
                "Mark payment as PENDING if not received.",
              ].map((step: any, i: any) => (
                <li
                  key={i}
                  className="flex gap-3 text-xs text-[#4B5563] font-medium leading-relaxed"
                >
                  <span className="text-[#9CA3AF]">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 border border-[#E5E7EB] rounded-2xl">
            <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-widest mb-4">
              Event Info
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6B7280]">Capacity</span>
                <span className="font-bold">
                  {eventDetails.maxCapacity} Slots
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6B7280]">Type</span>
                <span className="font-bold uppercase">
                  {participationTypeLabel}
                </span>
              </div>
              <div className="pt-4 border-t border-[#F3F4F6]">
                <p className="text-[10px] text-[#9CA3AF] italic leading-relaxed">
                  Offline entries are marked &quot;Offline Entry&quot; in the
                  system for verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!viewRegistration}
        onClose={() => setViewRegistration(null)}
        title="Registration Details"
        size="md"
        footer={
          <div className="flex justify-end">
            <button
              onClick={() => setViewRegistration(null)}
              className="px-5 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-semibold hover:bg-[#2D2D2D]"
            >
              Close
            </button>
          </div>
        }
      >
        {viewRegistration && (
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-[#6B7280]">Type:</span>{" "}
              <span className="font-semibold text-[#1A1A1A]">
                {viewRegistration.team ? "Team" : "Individual"}
              </span>
            </div>
            {viewRegistration.team?.teamName && (
              <div>
                <span className="text-[#6B7280]">Team Name:</span>{" "}
                <span className="font-semibold text-[#1A1A1A]">
                  {viewRegistration.team.teamName}
                </span>
              </div>
            )}
            <div>
              <span className="text-[#6B7280]">Student Name:</span>{" "}
              <span className="font-semibold text-[#1A1A1A]">
                {viewRegistration.studentName}
              </span>
            </div>
            <div>
              <span className="text-[#6B7280]">Student ID:</span>{" "}
              <span className="font-semibold text-[#1A1A1A] uppercase">
                {viewRegistration.studentId}
              </span>
            </div>
            {viewRegistration.email && (
              <div>
                <span className="text-[#6B7280]">Email:</span>{" "}
                <span className="font-semibold text-[#1A1A1A]">
                  {viewRegistration.email}
                </span>
              </div>
            )}
            {viewRegistration.phone && (
              <div>
                <span className="text-[#6B7280]">Phone:</span>{" "}
                <span className="font-semibold text-[#1A1A1A]">
                  {viewRegistration.phone}
                </span>
              </div>
            )}
            {viewRegistration.year && (
              <div>
                <span className="text-[#6B7280]">Year:</span>{" "}
                <span className="font-semibold text-[#1A1A1A]">
                  {viewRegistration.year}
                </span>
              </div>
            )}
            {viewRegistration.branch && (
              <div>
                <span className="text-[#6B7280]">Branch/Department:</span>{" "}
                <span className="font-semibold text-[#1A1A1A]">
                  {viewRegistration.branch}
                </span>
              </div>
            )}
            {viewRegistration.section && (
              <div>
                <span className="text-[#6B7280]">Section:</span>{" "}
                <span className="font-semibold text-[#1A1A1A]">
                  {viewRegistration.section}
                </span>
              </div>
            )}
            {viewRegistration.paymentStatus && (
              <div>
                <span className="text-[#6B7280]">Payment Status:</span>{" "}
                <span className="font-semibold text-[#1A1A1A]">
                  {viewRegistration.paymentStatus}
                </span>
              </div>
            )}
            {viewRegistration.amount !== null &&
              viewRegistration.amount !== undefined &&
              viewRegistration.amount !== "" && (
                <div>
                  <span className="text-[#6B7280]">Amount:</span>{" "}
                  <span className="font-semibold text-[#1A1A1A]">
                    ₹{viewRegistration.amount}
                  </span>
                </div>
              )}

            {viewRegistration.team?.members?.length > 0 && (
              <div className="pt-3 border-t border-[#E5E7EB]">
                <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">
                  Team Members
                </p>
                <div className="space-y-2">
                  {sortTeamMembersInRegisteredOrder(
                    viewRegistration.team.members,
                  ).map((member: any, index: number) => (
                    <div
                      key={
                        member.id ||
                        `${member.rollNumber || member.name}-${index}`
                      }
                      className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                          {member.name || "Member"}
                        </p>
                        {member.role && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280]">
                            {member.role}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-xs text-[#4B5563]">
                        {member.rollNumber && <p>Roll: {member.rollNumber}</p>}
                        {member.phone && <p>Phone: {member.phone}</p>}
                        {member.email && <p>Email: {member.email}</p>}
                        {member.year && <p>Year: {member.year}</p>}
                        {member.department && (
                          <p>Department: {member.department}</p>
                        )}
                        {member.section && <p>Section: {member.section}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!editRegistration}
        onClose={() => setEditRegistration(null)}
        title="Edit Registration"
        size="lg"
        onConfirm={handleSaveEditedRegistration}
        confirmText={isUpdatingRegistration ? "Saving..." : "Save Changes"}
      >
        {editRegistration && (
          <div className="space-y-4">
            {editRegistration.team && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                    Team Name
                  </label>
                  <input
                    value={editForm.teamName}
                    onChange={(e) =>
                      setEditForm((prev: any) => ({
                        ...prev,
                        teamName: e.target.value,
                      }))
                    }
                    className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                    Team Members
                  </label>
                  <button
                    type="button"
                    onClick={addEditMember}
                    className="h-9 px-3 rounded-lg border border-[#E5E7EB] text-[11px] font-bold uppercase tracking-wider hover:bg-[#F7F8FA]"
                  >
                    + Add Member
                  </button>
                </div>

                <div className="space-y-3">
                  {(editForm.members || []).map(
                    (member: TeamMemberField, index: number) => (
                      <div
                        key={`${member.rollNumber || member.name || "member"}-${index}`}
                        className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black bg-[#F3F4F6] px-2 py-0.5 rounded text-[#6B7280]">
                            {index === 0 ? "LEADER" : `MEMBER ${index + 1}`}
                          </span>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => removeEditMember(index)}
                              className="h-8 px-2.5 rounded-lg border border-[#FECACA] text-[#EF4444] hover:bg-[#FEF2F2] text-[10px] font-bold uppercase tracking-wider"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            value={member.name}
                            onChange={(e) =>
                              updateEditMember(index, "name", e.target.value)
                            }
                            placeholder="Student Name"
                            className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                          />
                          <input
                            value={member.rollNumber}
                            onChange={(e) =>
                              updateEditMember(
                                index,
                                "rollNumber",
                                e.target.value.toUpperCase(),
                              )
                            }
                            placeholder="Roll Number"
                            className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none uppercase"
                          />
                          <input
                            value={member.phone}
                            onChange={(e) =>
                              updateEditMember(index, "phone", e.target.value)
                            }
                            placeholder="Phone Number"
                            className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                          />
                          <input
                            value={member.year}
                            onChange={(e) =>
                              updateEditMember(index, "year", e.target.value)
                            }
                            placeholder="Year"
                            className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                          />
                          <input
                            value={member.email}
                            onChange={(e) =>
                              updateEditMember(index, "email", e.target.value)
                            }
                            placeholder="Email (optional)"
                            className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                          />
                          <select
                            value={member.role}
                            onChange={(e) =>
                              updateEditMember(index, "role", e.target.value)
                            }
                            className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm font-medium bg-white focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                          >
                            <option value="Captain">Captain</option>
                            <option value="Vice Captain">Vice Captain</option>
                            <option value="Member">Member</option>
                          </select>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {!editRegistration.team && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                    Student Name
                  </label>
                  <input
                    value={editForm.studentName}
                    onChange={(e) =>
                      setEditForm((prev: any) => ({
                        ...prev,
                        studentName: e.target.value,
                      }))
                    }
                    className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                    Student ID
                  </label>
                  <input
                    value={editForm.studentId}
                    onChange={(e) =>
                      setEditForm((prev: any) => ({
                        ...prev,
                        studentId: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none uppercase"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                  Email
                </label>
                <input
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev: any) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                  Phone
                </label>
                <input
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((prev: any) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                  Year
                </label>
                <input
                  value={editForm.year}
                  onChange={(e) =>
                    setEditForm((prev: any) => ({
                      ...prev,
                      year: e.target.value,
                    }))
                  }
                  className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                  Registration Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((prev: any) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] text-sm font-medium bg-white focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="WAITLISTED">WAITLIST</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                  Amount
                </label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm((prev: any) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="w-full h-11 px-4 rounded-lg border border-[#E5E7EB] text-sm font-medium focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!registrationToDelete}
        onClose={() => {
          if (!isDeletingRegistration) {
            setRegistrationToDelete(null);
          }
        }}
        onConfirm={() =>
          registrationToDelete && handleDelete(registrationToDelete.id)
        }
        title="Delete Registration"
        message={`Are you sure you want to delete registration for ${registrationToDelete?.team ? registrationToDelete.team.teamName : registrationToDelete?.studentName}?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeletingRegistration}
      />
    </div>
  );
}

function PaymentSection({
  register,
  paymentStatus,
  eventFee,
  paymentMode,
  setPaymentMode,
}: {
  register: any;
  paymentStatus: string;
  eventFee: any;
  paymentMode: "CASH" | "UPI" | "BANK";
  setPaymentMode: (mode: "CASH" | "UPI" | "BANK") => void;
}) {
  return (
    <div className="border-t border-[#F3F4F6] pt-6 mt-8 space-y-6">
      <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">
        Payment Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">
            Status
          </label>
          <div className="flex gap-2">
            <label
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border cursor-pointer transition-all ${paymentStatus === "PAID" ? "bg-[#ECFDF5] border-[#10B981] text-[#059669]" : "bg-white border-[#E5E7EB] text-gray-400"}`}
            >
              <input
                {...register("paymentStatus")}
                type="radio"
                value="PAID"
                className="hidden"
              />
              <span className="font-bold text-xs uppercase">Paid</span>
            </label>
            <label
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border cursor-pointer transition-all ${paymentStatus === "PENDING" ? "bg-[#FFFBEB] border-[#F59E0B] text-[#B45309]" : "bg-white border-[#E5E7EB] text-gray-400"}`}
            >
              <input
                {...register("paymentStatus")}
                type="radio"
                value="PENDING"
                className="hidden"
              />
              <span className="font-bold text-xs uppercase">Pending</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">
            Amount Collected
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              ₹
            </span>
            <input
              {...register("amount")}
              type="number"
              className="w-full h-10 pl-7 pr-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-sm font-bold focus:ring-1 focus:ring-[#1A1A1A] outline-none"
            />
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">
            Method
          </label>
          <div className="flex gap-2">
            {(["CASH", "UPI", "BANK"] as const).map((mode: any) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPaymentMode(mode)}
                className={`flex-1 h-10 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${paymentMode === mode ? "bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-sm" : "bg-white border-[#E5E7EB] text-gray-500 hover:border-gray-300"}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
