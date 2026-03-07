import {
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  Clock,
  Building2,
  Trophy,
  UserCheck,
  FileText,
  X,
} from "lucide-react";
import { Modal } from "./Modal";
import { formatTimeTo12h } from "@/lib/dateUtils";

interface EventDetailsModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailsModal({
  event,
  isOpen,
  onClose,
}: EventDetailsModalProps) {
  if (!event) return null;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time?: string | null) => {
    return formatTimeTo12h(time);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Event Details" size="xl">
      <div className="space-y-6">
        {/* Event Poster */}
        {event.posterUrl && (
          <div className="relative w-full h-48 rounded-xl overflow-hidden">
            <img
              src={event.posterUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg">
              <span className="text-xs font-bold text-[#1A1A1A]">
                {event.category}
              </span>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div>
          <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">
            {event.title}
          </h3>
          <div className="bg-[#F7F8FA] rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[#6B7280] mt-0.5" />
                <div>
                  <div className="text-xs text-[#6B7280] mb-1">Event Date</div>
                  <div className="text-sm font-medium text-[#1A1A1A]">
                    {formatDate(event.date)}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#6B7280] mt-0.5" />
                <div>
                  <div className="text-xs text-[#6B7280] mb-1">Time</div>
                  <div className="text-sm font-medium text-[#1A1A1A]">
                    {event.time
                      ? formatTime(event.time)
                      : event.startTime || event.endTime
                        ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
                        : "TBD"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#6B7280] mt-0.5" />
                <div>
                  <div className="text-xs text-[#6B7280] mb-1">Venue</div>
                  <div className="text-sm font-medium text-[#1A1A1A]">
                    {event.venue}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-[#6B7280] mt-0.5" />
                <div>
                  <div className="text-xs text-[#6B7280] mb-1">
                    Location Type
                  </div>
                  <div className="text-sm font-medium text-[#1A1A1A] capitalize">
                    {event.locationType || "Physical"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div>
            <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
              Description
            </h4>
            <div className="bg-[#F7F8FA] rounded-xl p-4">
              <p className="text-sm text-[#6B7280] leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>
        )}

        {/* Registration & Capacity */}
        <div>
          <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
            Registration Details
          </h4>
          <div className="bg-[#F7F8FA] rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-[#6B7280] mt-0.5" />
                <div>
                  <div className="text-xs text-[#6B7280] mb-1">Capacity</div>
                  <div className="text-sm font-medium text-[#1A1A1A]">
                    {event.maxCapacity} participants
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-[#6B7280] mt-0.5" />
                <div>
                  <div className="text-xs text-[#6B7280] mb-1">Registered</div>
                  <div className="text-sm font-medium text-[#1A1A1A]">
                    {event.registrationsCount ||
                      event._count?.registrations ||
                      0}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IndianRupee className="w-5 h-5 text-[#6B7280] mt-0.5" />
                <div>
                  <div className="text-xs text-[#6B7280] mb-1">Fee</div>
                  <div className="text-sm font-medium text-[#1A1A1A]">
                    {event.fee || "Free"}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF]">
                  Registration Fill
                </span>
                <span className="text-[10px] font-black text-[#1A1A1A]">
                  {Math.round(
                    ((event.registrationsCount ||
                      event._count?.registrations ||
                      0) /
                      event.maxCapacity) *
                      100,
                  )}
                  %
                </span>
              </div>
              <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(((event.registrationsCount || event._count?.registrations || 0) / event.maxCapacity) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Event Type & Team Info */}
        {event.eventType && (
          <div>
            <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
              Event Type
            </h4>
            <div className="bg-[#F7F8FA] rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[#6B7280] mb-1">Type</div>
                  <div className="text-sm font-medium text-[#1A1A1A] capitalize">
                    {event.eventType}
                  </div>
                </div>
                {event.eventType === "team" &&
                  event.teamSizeMin &&
                  event.teamSizeMax && (
                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">
                        Team Size
                      </div>
                      <div className="text-sm font-medium text-[#1A1A1A]">
                        {event.teamSizeMin} - {event.teamSizeMax} members
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Coordinators */}
        {event.assignedCoordinators &&
          Array.isArray(event.assignedCoordinators) &&
          event.assignedCoordinators.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                Event Coordinators
              </h4>
              <div className="bg-[#F7F8FA] rounded-xl p-4 space-y-3">
                {event.assignedCoordinators.map((coord: any) => (
                  <div
                    key={coord.id}
                    className="flex items-start gap-3 p-3 bg-white rounded-lg"
                  >
                    <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {coord.name?.charAt(0) || "C"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#1A1A1A]">
                        {coord.name}
                      </div>
                      <div className="text-xs text-[#6B7280] mt-1">
                        {coord.email}
                      </div>
                      <div className="text-xs text-[#6B7280]">
                        {coord.phone}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Eligibility */}
        {event.eligibility &&
          Array.isArray(event.eligibility) &&
          event.eligibility.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
                Eligibility Criteria
              </h4>
              <div className="bg-[#F7F8FA] rounded-xl p-4">
                <div className="flex flex-wrap gap-2">
                  {event.eligibility.map((criteria: any, index: any) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#1A1A1A]"
                    >
                      {criteria}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* Prizes */}
        {event.prizes && (
          <div>
            <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">
              Prizes & Recognition
            </h4>
            <div className="bg-[#F7F8FA] rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {event.prizes.first && (
                  <div className="p-3 bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-[#92400E]" />
                      <span className="text-xs font-bold text-[#92400E]">
                        1st Prize
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#92400E]">
                      ₹{event.prizes.first.amount}
                    </div>
                  </div>
                )}
                {event.prizes.second && (
                  <div className="p-3 bg-gradient-to-br from-[#E5E7EB] to-[#D1D5DB] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-[#1F2937]" />
                      <span className="text-xs font-bold text-[#1F2937]">
                        2nd Prize
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#1F2937]">
                      ₹{event.prizes.second.amount}
                    </div>
                  </div>
                )}
                {event.prizes.third && (
                  <div className="p-3 bg-gradient-to-br from-[#FED7AA] to-[#FDBA74] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-[#7C2D12]" />
                      <span className="text-xs font-bold text-[#7C2D12]">
                        3rd Prize
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#7C2D12]">
                      ₹{event.prizes.third.amount}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        <div>
          <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Status</h4>
          <div className="bg-[#F7F8FA] rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${event.registrationOpen ? "bg-[#10B981]" : "bg-[#EF4444]"}`}
                />
                <span className="text-sm text-[#1A1A1A]">
                  Registration {event.registrationOpen ? "Open" : "Closed"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${new Date(event.date) > new Date() ? "bg-[#3B82F6]" : "bg-[#6B7280]"}`}
                />
                <span className="text-sm text-[#1A1A1A]">
                  {new Date(event.date) > new Date() ? "Upcoming" : "Completed"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Close Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
