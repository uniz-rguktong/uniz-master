"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { BasicDetailsStep } from "@/components/events/steps/BasicDetailsStep";
import { EventInformationStep } from "@/components/events/steps/EventInformationStep";
import { RegistrationSettingsStep } from "@/components/events/steps/RegistrationSettingsStep";
import { MediaAssetsStep } from "@/components/events/steps/MediaAssetsStep";
import { ReviewPublishStep } from "@/components/events/steps/ReviewPublishStep";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import { createEvent, updateEvent } from "@/actions/eventActions";

const steps = [
  { id: 1, name: "Basic Details", component: BasicDetailsStep },
  { id: 2, name: "Event Information", component: EventInformationStep },
  { id: 3, name: "Registration Settings", component: RegistrationSettingsStep },
  { id: 4, name: "Media & Assets", component: MediaAssetsStep },
  { id: 5, name: "Review & Publish", component: ReviewPublishStep },
];

interface CreateEventPageProps {
  onNavigate?: (path: string, options?: Record<string, unknown>) => void;
  mode?: string;
  initialData?: Record<string, any>;
}

function buildCreateDefaults() {
  return {
    category: "Technical Events",
    eventType: "competition",
    hasPrizes: true,
    locationType: "physical",
    registrationStatus: "open",
    isPaid: false,
    paymentGateway: "UPI",
    capacity: "",
    maxParticipants: "100",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  };
}

export function CreateEventPage({
  onNavigate,
  mode = "create",
  initialData,
}: CreateEventPageProps = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [eventData, setEventData] = useState(
    mode === "create"
      ? { ...buildCreateDefaults(), ...(initialData || {}) }
      : initialData || {},
  );
  const { toast, showToast, hideToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load edit/copy data from localStorage if needed
  useEffect(() => {
    if (mode === "edit" || mode === "copy") {
      const mapToFormData = (parsed: Record<string, any>) => {
        const toNumericText = (value: unknown) => {
          if (value === null || value === undefined || value === "") return "";
          const numeric = Number(value);
          if (!Number.isFinite(numeric)) return "";
          return String(Math.trunc(numeric));
        };

        const normalizedEventType = String(parsed.eventType || "individual");
        const isTeamEvent = normalizedEventType.toLowerCase().includes("team");
        const isCompetitionEvent = normalizedEventType
          .toLowerCase()
          .includes("competition");
        const parsedCustomFields = parsed.customFields;
        const registrationCustomFields = Array.isArray(parsedCustomFields)
          ? parsedCustomFields
          : Array.isArray(parsedCustomFields?.registrationFields)
            ? parsedCustomFields.registrationFields
            : [];
        const eventMeta =
          !Array.isArray(parsedCustomFields) &&
          parsedCustomFields &&
          typeof parsedCustomFields === "object"
            ? parsedCustomFields.eventMeta || {}
            : {};
        const derivedHasPrizes =
          typeof parsed.hasPrizes === "boolean"
            ? parsed.hasPrizes
            : isCompetitionEvent || Boolean((parsed.prizes || []).length);
        const safeCapacity = toNumericText(
          parsed.capacity ?? parsed.maxCapacity,
        );
        const derivedShortDescription = String(
          parsed.shortDescription ||
            parsed.description ||
            parsed.title ||
            "Event details",
        ).trim();

        const mappedData: Record<string, any> = {
          ...parsed,
          eventName: parsed.eventName || parsed.title || "",
          detailedDescription:
            parsed.detailedDescription || parsed.description || "",
          shortDescription: derivedShortDescription,
          category: parsed.category || "General",
          subCategory: parsed.subCategory || eventMeta.subCategory || "",
          eventType: normalizedEventType,
          hasPrizes: derivedHasPrizes,
          teamSize: {
            min: toNumericText(parsed.teamSize?.min ?? parsed.teamSizeMin),
            max: toNumericText(parsed.teamSize?.max ?? parsed.teamSizeMax),
          },
          locationType: parsed.locationType || "physical",
          venue: parsed.venue || "",
          startDate:
            parsed.startDate ||
            (parsed.date
              ? new Date(parsed.date).toISOString().split("T")[0]
              : ""),
          endDate: parsed.endDate
            ? new Date(parsed.endDate).toISOString().split("T")[0]
            : parsed.date
              ? new Date(parsed.date).toISOString().split("T")[0]
              : "",
          startTime:
            parsed.startTime ||
            (parsed.date
              ? new Date(parsed.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : ""),
          endTime: parsed.endTime || "",
          capacity: safeCapacity,
          maxParticipants: toNumericText(
            parsed.maxParticipants ?? safeCapacity,
          ),
          isPaid:
            parsed.isPaid !== undefined
              ? parsed.isPaid
              : Number(parsed.price || 0) > 0,
          fee: parsed.fee || String(parsed.price || "0"),
          minParticipants: parsed.minParticipants || "",
          waitlistEnabled: Boolean(parsed.waitlistEnabled),
          paymentGateway: parsed.paymentGateway || "All Methods",
          rules: parsed.rules || "",
          publishType: parsed.publishType || eventMeta.publishType || "now",
          scheduledPublishDate:
            parsed.scheduledPublishDate || eventMeta.scheduledPublishDate || "",
          scheduledPublishTime:
            parsed.scheduledPublishTime || eventMeta.scheduledPublishTime || "",
          registrationStatus:
            parsed.registrationStatus ||
            (parsed.registrationOpen ? "open" : "closed"),
          poster: parsed.poster || parsed.posterUrl || "",
          coordinators:
            parsed.coordinators || parsed.assignedCoordinators || [],
          customFields: registrationCustomFields,
        };

        if (mode === "copy") {
          delete mappedData.id;
          delete mappedData._id;
          mappedData.eventName = `${mappedData.eventName} (Copy)`;
        }

        setEventData(mappedData);
      };

      if (initialData && Object.keys(initialData).length > 0) {
        mapToFormData(initialData);
      } else {
        const savedData = localStorage.getItem("editEventData");
        if (savedData) {
          try {
            mapToFormData(JSON.parse(savedData));
          } catch (e) {
            console.error("Failed to parse edit/copy data", e);
          }
        }
      }
    } else if (mode === "create") {
      localStorage.removeItem("editEventData"); // Clear any stale edit data
      setEventData({ ...buildCreateDefaults(), ...(initialData || {}) });
    }
  }, [mode, initialData]);

  const CurrentStepComponent = steps[currentStep - 1]?.component as any;

  const parsePositiveInt = (value: unknown) => {
    const parsed = parseInt(String(value || ""), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const validateStep = (
    step: number,
    candidateData: Record<string, any> = eventData,
  ) => {
    if (step === 1) {
      const name = String(
        candidateData.eventName || candidateData.title || "",
      ).trim();
      const category = String(candidateData.category || "").trim();
      const shortDescription = String(
        candidateData.shortDescription || "",
      ).trim();
      const hasPrizesSelected = typeof candidateData.hasPrizes === "boolean";
      const eventType = String(candidateData.eventType || "").trim();
      const isEditMode = mode === "edit";

      if (!name) return "Event name is required.";
      if (!category && !isEditMode) return "Category is required.";
      if (!shortDescription && !isEditMode)
        return "Short description is required.";
      if (!eventType && !isEditMode) return "Participation type is required.";
      if (!hasPrizesSelected && !isEditMode)
        return "Tournament style is required.";

      if (eventType.toLowerCase().includes("team")) {
        const min = parsePositiveInt(candidateData.teamSize?.min);
        const max = parsePositiveInt(candidateData.teamSize?.max);
        if (min < 1) return "Team minimum size must be at least 1.";
        if (max <= 1) return "Team maximum size must be greater than 1.";
        if (max < min)
          return "Team maximum size must be greater than or equal to minimum size.";
      }
    }

    if (step === 2) {
      const category = String(candidateData.category || "")
        .trim()
        .toLowerCase();
      const locationType = String(candidateData.locationType || "").trim();
      const venue = String(candidateData.venue || "").trim();
      const capacity = parsePositiveInt(candidateData.capacity);
      const startDate = String(candidateData.startDate || "").trim();
      const endDate = String(candidateData.endDate || "").trim();
      const startTime = String(candidateData.startTime || "").trim();
      const endTime = String(candidateData.endTime || "").trim();
      const coordinators = candidateData.coordinators || [];

      if (!locationType) return "Location type is required.";
      if (!venue) return "Venue name is required.";
      if (capacity <= 0) return "Venue capacity must be a positive integer.";
      if (!startDate || !endDate) return "Start and end dates are required.";
      if (!startTime || !endTime) return "Start and end times are required.";
      if (category !== "sports" && coordinators.length === 0)
        return "At least one coordinator is required.";

      if (new Date(startDate) > new Date(endDate)) {
        return "Start date must be less than or equal to end date.";
      }

      if (startDate === endDate && startTime >= endTime) {
        return "When start and end dates are the same, start time must be less than end time.";
      }
    }

    if (step === 3) {
      const registrationStatus = String(
        candidateData.registrationStatus || "",
      ).trim();
      const maxParticipants = parsePositiveInt(candidateData.maxParticipants);
      const venueCapacity = parsePositiveInt(candidateData.capacity);

      if (!registrationStatus) return "Registration status is required.";
      if (maxParticipants <= 0)
        return "Maximum participants must be a positive integer.";
      if (venueCapacity > 0 && maxParticipants > venueCapacity) {
        return "Maximum participants cannot be greater than venue capacity.";
      }
    }

    return null;
  };

  const validateAllStepsForPublish = () => {
    if (mode === "edit") {
      return null;
    }

    let publishCandidateData = eventData;
    const publishMaxParticipants = parsePositiveInt(eventData.maxParticipants);
    const publishVenueCapacity = parsePositiveInt(eventData.capacity);
    if (
      publishVenueCapacity > 0 &&
      publishMaxParticipants > publishVenueCapacity
    ) {
      publishCandidateData = {
        ...eventData,
        maxParticipants: String(publishVenueCapacity),
      };
      setEventData(publishCandidateData);
    }

    for (const step of [1, 2, 3]) {
      const error = validateStep(step, publishCandidateData);
      if (error) {
        setCurrentStep(step);
        return error;
      }
    }
    return null;
  };

  const nextStep = () => {
    if (mode !== "edit") {
      let validationCandidateData = eventData;

      if (currentStep === 3) {
        const maxParticipants = parsePositiveInt(eventData.maxParticipants);
        const venueCapacity = parsePositiveInt(eventData.capacity);

        if (venueCapacity > 0 && maxParticipants > venueCapacity) {
          validationCandidateData = {
            ...eventData,
            maxParticipants: String(venueCapacity),
          };
          setEventData(validationCandidateData);
        }
      }

      const validationError = validateStep(
        currentStep,
        validationCandidateData,
      );
      if (validationError) {
        showToast(validationError, "error");
        return;
      }
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      if (mode !== "view" && mode !== "edit") {
        showToast("Progress saved", "success");
      }
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveEvent = async (status = "PUBLISHED") => {
    setIsSubmitting(true);
    try {
      const toText = (value: unknown, fallback = "") => {
        if (value === null || value === undefined) return fallback;
        return String(value);
      };

      if (status === "PUBLISHED") {
        const validationError = validateAllStepsForPublish();
        if (validationError) {
          throw new Error(validationError);
        }
      }

      // Client-side validation
      const title = eventData.eventName || eventData.title || "";
      const eventDate = eventData.startDate || eventData.date || "";

      if (!title.trim() && mode !== "edit") {
        throw new Error(
          "Event name is required. Please fill in the Basic Details step.",
        );
      }

      if (status === "PUBLISHED" && !eventDate && mode !== "edit") {
        throw new Error(
          "Event date is required. Please fill in the Event Information step.",
        );
      }

      const formData = new FormData();

      // Basic Details
      formData.append("title", toText(title));
      formData.append(
        "description",
        toText(eventData.detailedDescription || eventData.description),
      );
      formData.append("shortDescription", toText(eventData.shortDescription));
      formData.append("category", toText(eventData.category));
      formData.append("subCategory", toText(eventData.subCategory));
      formData.append("status", toText(status));

      // Event Type & Team Settings
      formData.append("eventType", toText(eventData.eventType, "individual"));
      if (
        String(eventData.eventType || "")
          .toLowerCase()
          .includes("team") &&
        eventData.teamSize
      ) {
        formData.append("teamSizeMin", toText(eventData.teamSize.min));
        formData.append("teamSizeMax", toText(eventData.teamSize.max));
      }

      // Location & Venue
      formData.append(
        "locationType",
        toText(eventData.locationType, "physical"),
      );
      formData.append("venue", toText(eventData.venue));
      formData.append(
        "capacity",
        toText(eventData.capacity || eventData.maxParticipants),
      );

      // Date & Time
      formData.append(
        "date",
        eventDate
          ? new Date(eventDate).toISOString()
          : new Date().toISOString(),
      );
      formData.append("startTime", toText(eventData.startTime));
      formData.append("endTime", toText(eventData.endTime));
      if (eventData.endDate) {
        formData.append("endDate", new Date(eventData.endDate).toISOString());
      }

      // Registration Settings
      formData.append(
        "registrationStatus",
        toText(eventData.registrationStatus, "open"),
      );

      const backendCapacity = parsePositiveInt(eventData.capacity);
      const backendMaxParticipants = parsePositiveInt(
        eventData.maxParticipants || eventData.capacity,
      );

      let finalMaxParticipants = backendMaxParticipants || backendCapacity;
      if (backendCapacity > 0 && finalMaxParticipants > backendCapacity) {
        finalMaxParticipants = backendCapacity;
      }

      formData.append("maxParticipants", toText(finalMaxParticipants));
      formData.append("minParticipants", toText(eventData.minParticipants));
      formData.append(
        "waitlistEnabled",
        eventData.waitlistEnabled ? "true" : "false",
      );

      // Fee & Payment
      formData.append("isPaid", eventData.isPaid ? "true" : "false");
      formData.append("fee", toText(eventData.fee, "0"));
      formData.append(
        "paymentGateway",
        toText(eventData.paymentGateway, "All Methods"),
      );

      // Media
      formData.append(
        "posterUrl",
        toText(eventData.poster || eventData.posterUrl),
      );

      // Complex Data (JSON)
      formData.append(
        "coordinators",
        JSON.stringify(eventData.coordinators || []),
      );
      formData.append(
        "eligibility",
        JSON.stringify(eventData.eligibility || []),
      );
      const registrationCustomFields = Array.isArray(eventData.customFields)
        ? eventData.customFields
        : Array.isArray(eventData.customFields?.registrationFields)
          ? eventData.customFields.registrationFields
          : [];
      formData.append(
        "customFields",
        JSON.stringify({
          registrationFields: registrationCustomFields,
          eventMeta: {
            subCategory: toText(eventData.subCategory),
            publishType: toText(eventData.publishType, "now"),
            scheduledPublishDate: toText(eventData.scheduledPublishDate),
            scheduledPublishTime: toText(eventData.scheduledPublishTime),
          },
        }),
      );
      formData.append("documents", JSON.stringify(eventData.documents || []));
      formData.append("rules", toText(eventData.rules));
      formData.append("hasPrizes", String(eventData.hasPrizes || false));

      // Call Server Action
      let result;
      const isUpdate = mode === "edit" && (eventData.id || initialData?.id);

      if (isUpdate) {
        const idToUpdate = eventData.id || initialData?.id;
        formData.append("id", toText(idToUpdate));
        result = await updateEvent(formData);
      } else {
        result = await createEvent(formData);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      const successMessage =
        status === "DRAFT"
          ? "Event saved as draft successfully!"
          : isUpdate
            ? "Event updated successfully!"
            : "Event published successfully!";

      showToast(successMessage, "success");

      if (mode === "edit" || mode === "copy") {
        localStorage.removeItem("editEventData");
      }

      if (onNavigate) {
        onNavigate("all-events");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to save event: " + (error as any).message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    saveEvent("DRAFT");
  };

  const handlePublish = () => {
    setShowConfirm(true);
  };

  const confirmPublish = async () => {
    setShowConfirm(false);
    saveEvent("PUBLISHED");
  };

  const getPageTitle = () => {
    if (mode === "edit" || (eventData.id && mode !== "create"))
      return "Edit Event";
    if (mode === "view") return "View Event";
    return "Create New Event";
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8 animate-page-entrance">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
            <span>Dashboard</span>
            <span>›</span>
            <span>Events Management</span>
            <span>›</span>
            <span className="text-[#1A1A1A] font-medium">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                onNavigate ? onNavigate("all-events") : window.history.back()
              }
              className="p-2 hover:bg-white rounded-lg border border-[#E5E7EB] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
            </button>
            <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A]">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Progress Stepper */}
        <div
          className="bg-white rounded-xl border border-[#E5E7EB] p-4 md:p-6 mb-6 animate-card-entrance"
          style={{ animationDelay: "40ms" }}
        >
          <div className="flex items-center justify-between">
            {steps.map((step: any, index: any) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all shrink-0 ${
                      currentStep > step.id
                        ? "bg-[#10B981] text-white"
                        : currentStep === step.id
                          ? "bg-[#1A1A1A] text-white"
                          : "bg-[#F7F8FA] text-[#6B7280] border-2 border-[#E5E7EB]"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="hidden md:block shrink-0">
                    <div
                      className={`text-sm font-semibold ${currentStep >= step.id ? "text-[#1A1A1A]" : "text-[#6B7280]"}`}
                    >
                      {step.name}
                    </div>
                    <div className="text-xs text-[#9CA3AF]">
                      Step {step.id} of {steps.length}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2 md:mx-4">
                    <div
                      className={`h-0.5 transition-all ${currentStep > step.id ? "bg-[#10B981]" : "bg-[#E5E7EB]"}`}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div
          className="bg-[#F4F2F0] rounded-[18px] mb-6 px-3 py-6 animate-card-entrance"
          style={{ animationDelay: "80ms" }}
        >
          <div className="mb-4 pl-3">
            <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-1">
              {steps[currentStep - 1]?.name}
            </h3>
            <p className="text-xs text-[#6B7280]">
              {currentStep === 1 &&
                "Enter the basic information about your event"}
              {currentStep === 2 &&
                "Provide detailed information about the event"}
              {currentStep === 3 &&
                "Configure registration and participation settings"}
              {currentStep === 4 &&
                "Upload images, videos, and other media files"}
              {currentStep === 5 && "Review all details and publish your event"}
            </p>
          </div>

          <div
            className={`bg-white rounded-[14px] border border-[#E5E7EB] p-4 md:p-8 shadow-sm ${mode === "view" ? "pointer-events-none opacity-90" : ""}`}
          >
            <CurrentStepComponent
              key={`${mode}-${eventData.id || eventData._id || "new"}-${currentStep}`}
              data={eventData}
              updateData={(newData: any) =>
                setEventData({ ...eventData, ...newData })
              }
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <button
            onClick={previousStep}
            disabled={currentStep === 1}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentStep === 1
                ? "bg-[#F7F8FA] text-[#9CA3AF] cursor-not-allowed"
                : "bg-white border border-[#E5E7EB] text-[#1A1A1A] hover:bg-[#F7F8FA]"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {mode !== "view" && (
              <button
                onClick={handleSaveDraft}
                className="px-6 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F7F8FA] transition-colors"
              >
                Save as Draft
              </button>
            )}

            {currentStep < steps.length ? (
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors"
              >
                {mode === "view" ? "Next" : "Continue"}
              </button>
            ) : mode === "view" ? (
              <button
                onClick={() => onNavigate && onNavigate("all-events")}
                className="px-6 py-3 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors"
              >
                Close View
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors disabled:opacity-70 disabled:cursor-wait"
              >
                {isSubmitting
                  ? "Publishing..."
                  : mode === "edit"
                    ? "Update Event"
                    : "Publish Event"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmPublish}
        title={
          mode === "edit" ? "Update Event?" : "Ready to Publish Your Event?"
        }
        message={
          mode === "edit"
            ? "Are you sure you want to save changes to this event?"
            : "Your event will be visible to all students and registrations will open immediately. Are you ready to publish?"
        }
        type="success"
        cancelLabel="Cancel"
        confirmLabel={mode === "edit" ? "Update" : "Publish"}
      />
    </div>
  );
}
