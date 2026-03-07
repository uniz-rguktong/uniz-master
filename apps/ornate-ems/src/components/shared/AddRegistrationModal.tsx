"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { useToast } from "@/hooks/useToast";
import { getSports, type FormattedSport } from "@/actions/sportGetters";
import {
  getCoordinatorEventDetails,
  type CoordinatorEventDetails,
} from "@/actions/coordinatorGetters";
import { createSportOfflineTeamRegistration } from "@/actions/sportRegistrationActions";
import { createSportRegistration } from "@/actions/sportRegistrationActions";
import { Loader2, Plus, Trash2, Users, User } from "lucide-react";

interface AddRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialSportId?: string | undefined;
}

export function AddRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  initialSportId,
}: AddRegistrationModalProps) {
  const { showToast } = useToast();
  const [sports, setSports] = useState<FormattedSport[]>([]);
  const [selectedSportId, setSelectedSportId] = useState<string>("");
  const [sportDetails, setSportDetails] =
    useState<CoordinatorEventDetails | null>(null);
  const [isLoadingSports, setIsLoadingSports] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationType, setRegistrationType] = useState<
    "individual" | "team" | null
  >(null);

  // Form Stats
  const [formData, setFormData] = useState({
    studentName: "",
    studentId: "",
    email: "",
    phone: "",
    year: "",
    branch: "",
    section: "",
    amount: 0,
    paymentStatus: "PAID",
  });

  const [teamData, setTeamData] = useState({
    teamName: "",
    members: [
      {
        name: "",
        rollNumber: "",
        email: "",
        phone: "",
        branch: "",
        year: "",
        section: "",
        role: "Captain" as "Captain" | "Vice Captain" | "Member",
      },
    ],
  });

  useEffect(() => {
    if (isOpen) {
      fetchSports();
      if (initialSportId) {
        setSelectedSportId(initialSportId);
      }
    }
  }, [isOpen, initialSportId]);

  const fetchSports = async () => {
    setIsLoadingSports(true);
    const res = await getSports();
    if (res.success && res.sports) {
      setSports(res.sports);
    }
    setIsLoadingSports(false);
  };

  useEffect(() => {
    if (selectedSportId) {
      fetchSportDetails(selectedSportId);
      setRegistrationType(null);
    } else {
      setSportDetails(null);
      setRegistrationType(null);
    }
  }, [selectedSportId]);

  const fetchSportDetails = async (id: string) => {
    setIsLoadingDetails(true);
    try {
      const res = await getCoordinatorEventDetails(id);
      if (res.success && res.event) {
        setSportDetails(res.event);
        setFormData((prev) => ({
          ...prev,
          amount: parseFloat(String(res.event?.fee)) || 0,
        }));

        const type =
          res.event.eventType?.toLowerCase() === "team" ? "team" : "individual";
        setRegistrationType(type);

        // Initialize team members if it's a team event
        if (type === "team") {
          setTeamData({
            teamName: "",
            members: [
              {
                name: "",
                rollNumber: "",
                email: "",
                phone: "",
                branch: "",
                year: "",
                section: "",
                role: "Captain" as any,
              },
            ],
          });
        }
      } else {
        showToast(res.error || "Failed to load tournament details", "error");
      }
    } catch (error) {
      showToast("An error occurred while fetching details", "error");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleMemberChange = (index: number, field: string, value: string) => {
    const newMembers = [...teamData.members];
    (newMembers[index] as any)[field] = value;
    setTeamData({ ...teamData, members: newMembers });
  };

  const addMember = () => {
    if (
      sportDetails?.teamSizeMax &&
      teamData.members.length >= sportDetails.teamSizeMax
    ) {
      showToast(`Maximum ${sportDetails.teamSizeMax} members allowed`, "error");
      return;
    }

    const newMemberIndex = teamData.members.length;
    const role = newMemberIndex === 1 ? "Vice Captain" : "Member";

    setTeamData({
      ...teamData,
      members: [
        ...teamData.members,
        {
          name: "",
          rollNumber: "",
          email: "",
          phone: "",
          branch: "",
          year: "",
          section: "",
          role: role as any,
        },
      ],
    });
  };

  const removeMember = (index: number) => {
    if (teamData.members.length <= 1) {
      showToast(`At least one member is required`, "error");
      return;
    }
    const newMembers = teamData.members.filter((_, i) => i !== index);
    setTeamData({ ...teamData, members: newMembers });
  };

  const handleSubmit = async () => {
    if (!selectedSportId) {
      showToast("Please select a sport", "error");
      return;
    }

    if (!registrationType) {
      showToast("Please select registration type", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (registrationType === "team") {
        if (!teamData.teamName.trim()) {
          showToast("Team name is required", "error");
          setIsSubmitting(false);
          return;
        }
        result = await createSportOfflineTeamRegistration({
          sportId: selectedSportId,
          teamName: teamData.teamName,
          members: teamData.members,
        });
      } else {
        if (!formData.studentName.trim() || !formData.studentId.trim()) {
          showToast("Student name and ID are required", "error");
          setIsSubmitting(false);
          return;
        }
        result = await createSportRegistration({
          sportId: selectedSportId,
          studentName: formData.studentName,
          studentId: formData.studentId,
          email: formData.email,
          phone: formData.phone,
          year: formData.year,
          branch: formData.branch,
          section: formData.section,
        });
      }

      if (result.success) {
        showToast(
          result.message || "Registration added successfully",
          "success",
        );
        onSuccess();
        onClose();
        // Reset form
        setSelectedSportId("");
        setRegistrationType(null);
        setFormData({
          studentName: "",
          studentId: "",
          email: "",
          phone: "",
          year: "",
          branch: "",
          section: "",
          amount: 0,
          paymentStatus: "PAID",
        });
      } else {
        showToast(result.error || "Failed to add registration", "error");
      }
    } catch (error) {
      console.error("Error adding registration:", error);
      showToast("An error occurred while adding registration", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Registration"
      size="lg"
      onConfirm={handleSubmit}
      confirmText={isSubmitting ? "Processing..." : "Register Now"}
      tooltipText="Manually add a student or team registration."
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
        {/* Sport Selection - Only shown if no initial sport is provided */}
        {!initialSportId && (
          <div>
            <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2 block">
              Select Sport
            </label>
            <div className="relative">
              <select
                value={selectedSportId}
                onChange={(e) => setSelectedSportId(e.target.value)}
                disabled={isLoadingSports}
                className="w-full h-12 px-4 rounded-xl border-2 border-[#E5E7EB] bg-[#F9FAFB] text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all appearance-none"
              >
                <option value="">-- Choose a Sport --</option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name} ({sport.category})
                  </option>
                ))}
              </select>
              {isLoadingSports ? (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="border-t-2 border-r-2 border-[#6B7280] w-2 h-2 rotate-135 translate-y-[-2px]" />
                </div>
              )}
            </div>
          </div>
        )}

        {isLoadingDetails ? (
          <div className="py-10 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4">
              Loading Tournament Details...
            </p>
          </div>
        ) : sportDetails ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
            {/* Header Info */}
            <div className="flex flex-col mb-2">
              <h4 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                {sportDetails.title}
              </h4>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mt-1">
                {sportDetails.eventType === "team"
                  ? `Team Competition`
                  : "Individual Solo Entry"}
              </p>
            </div>

            {registrationType && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                      {registrationType === "individual" ? (
                        <User className="w-3 h-3 text-orange-600" />
                      ) : (
                        <Users className="w-3 h-3 text-orange-600" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">
                      {registrationType} Registration Form
                    </span>
                  </div>
                </div>

                {registrationType === "team" ? (
                  /* Team Registration Fields */
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2 block">
                        Team Name
                      </label>
                      <input
                        type="text"
                        value={teamData.teamName}
                        onChange={(e) =>
                          setTeamData({ ...teamData, teamName: e.target.value })
                        }
                        placeholder="Enter unique team name"
                        className="w-full h-12 px-4 rounded-xl border-2 border-[#E5E7EB] bg-white text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Roster Members
                        </label>
                        <button
                          type="button"
                          onClick={addMember}
                          className="text-xs font-semibold text-orange-600 uppercase tracking-wider hover:text-orange-700 transition-colors"
                        >
                          + Add Member
                        </button>
                      </div>

                      {teamData.members.map((member, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl border-2 border-[#F3F4F6] bg-white space-y-4 relative"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                              {idx === 0
                                ? "TEAM LEADER / CAPTAIN"
                                : idx === 1
                                  ? "VICE CAPTAIN"
                                  : `MEMBER ${idx + 1}`}
                            </span>
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => removeMember(idx)}
                                className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                                  Student Name
                                </label>
                                <input
                                  type="text"
                                  placeholder="Full Name"
                                  value={member.name}
                                  onChange={(e) =>
                                    handleMemberChange(
                                      idx,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full h-11 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                                  Roll Number
                                </label>
                                <input
                                  type="text"
                                  placeholder="Roll Number"
                                  value={member.rollNumber}
                                  onChange={(e) =>
                                    handleMemberChange(
                                      idx,
                                      "rollNumber",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full h-11 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all uppercase"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                                  Email Address
                                </label>
                                <input
                                  type="email"
                                  placeholder="Email Address"
                                  value={member.email}
                                  onChange={(e) =>
                                    handleMemberChange(
                                      idx,
                                      "email",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full h-11 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                                  Phone Number
                                </label>
                                <input
                                  type="tel"
                                  placeholder="Phone Number"
                                  value={member.phone}
                                  onChange={(e) =>
                                    handleMemberChange(
                                      idx,
                                      "phone",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full h-11 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                                  Year
                                </label>
                                <select
                                  value={member.year || ""}
                                  onChange={(e) =>
                                    handleMemberChange(
                                      idx,
                                      "year",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full h-11 px-3 rounded-xl border-2 border-[#E5E7EB] text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all"
                                >
                                  <option value="">Select</option>
                                  <option value="I">I Year</option>
                                  <option value="II">II Year</option>
                                  <option value="III">III Year</option>
                                  <option value="IV">IV Year</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                                  Branch
                                </label>
                                <input
                                  type="text"
                                  placeholder="Branch"
                                  value={member.branch || ""}
                                  onChange={(e) =>
                                    handleMemberChange(
                                      idx,
                                      "branch",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full h-11 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                                  Section
                                </label>
                                <input
                                  type="text"
                                  placeholder="Section"
                                  value={member.section || ""}
                                  onChange={(e) =>
                                    handleMemberChange(
                                      idx,
                                      "section",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full h-11 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Individual Registration Fields */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Student Name
                        </label>
                        <input
                          type="text"
                          value={formData.studentName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              studentName: e.target.value,
                            })
                          }
                          placeholder="John Doe"
                          className="w-full h-11 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Roll Number
                        </label>
                        <input
                          type="text"
                          value={formData.studentId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              studentId: e.target.value,
                            })
                          }
                          placeholder="S123456"
                          className="w-full h-11 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all uppercase"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="john@example.com"
                          className="w-full h-11 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+91 0000000000"
                          className="w-full h-11 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Year
                        </label>
                        <select
                          value={formData.year}
                          onChange={(e) =>
                            setFormData({ ...formData, year: e.target.value })
                          }
                          className="w-full h-11 px-3 rounded-xl border-2 border-[#E5E7EB] text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all"
                        >
                          <option value="">Select</option>
                          <option value="I">I Year</option>
                          <option value="II">II Year</option>
                          <option value="III">III Year</option>
                          <option value="IV">IV Year</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Branch
                        </label>
                        <input
                          type="text"
                          value={formData.branch}
                          onChange={(e) =>
                            setFormData({ ...formData, branch: e.target.value })
                          }
                          placeholder="CSE"
                          className="w-full h-11 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                          Section
                        </label>
                        <input
                          type="text"
                          value={formData.section}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              section: e.target.value,
                            })
                          }
                          placeholder="A"
                          className="w-full h-11 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-bold focus:border-[#1A1A1A] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[32px]">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              Please select a sport to continue
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
