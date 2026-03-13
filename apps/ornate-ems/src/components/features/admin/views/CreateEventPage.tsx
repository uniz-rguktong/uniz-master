'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { BasicDetailsStep } from '@/components/events/steps/BasicDetailsStep';
import { EventInformationStep } from '@/components/events/steps/EventInformationStep';
import { RegistrationSettingsStep } from '@/components/events/steps/RegistrationSettingsStep';
import { MediaAssetsStep } from '@/components/events/steps/MediaAssetsStep';
import { ReviewPublishStep } from '@/components/events/steps/ReviewPublishStep';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { createEvent, updateEvent } from '@/actions/eventActions';
import { eventSchema } from '@/lib/validations/eventSchema';
import { z } from 'zod';

const steps = [
  { id: 1, name: 'Basic Details', component: BasicDetailsStep },
  { id: 2, name: 'Event Information', component: EventInformationStep },
  { id: 3, name: 'Registration Settings', component: RegistrationSettingsStep },
  { id: 4, name: 'Media & Assets', component: MediaAssetsStep },
  { id: 5, name: 'Review & Publish', component: ReviewPublishStep }];


interface CreateEventPageProps {
  onNavigate?: (path: string, options?: Record<string, unknown>) => void;
  mode?: string;
  initialData?: Record<string, any>;
}

function buildCreateDefaults() {
  return {
    eventName: '',
    title: '',
    category: 'Technical Events',
    subCategory: '',
    eventType: 'competition',
    hasPrizes: true,
    shortDescription: '',
    description: '',
    detailedDescription: '',
    locationType: 'physical',
    venue: '',
    capacity: '',
    startDate: '',
    date: '',
    endDate: '',
    startTime: '',
    endTime: '',
    coordinators: [],
    rules: `1. Participants must bring their college ID cards.
2. Event starts promptly at scheduled time.
3. Decision of the organizers/judges will be final.
4. Plagiarism of any kind will result in immediate disqualification.
5. Use of unfair means is strictly prohibited.`,
    registrationStatus: 'open',
    maxParticipants: '',
    minParticipants: '',
    waitlistEnabled: false,
    isPaid: false,
    fee: '0',
    paymentGateway: 'UPI',
    teamSize: { min: 1, max: 1 },
    poster: null,
    posterUrl: '',
    eligibility: [],
    customFields: [],
    publishType: 'immediate',
    scheduledPublishDate: '',
    scheduledPublishTime: '',
    documents: [],
    registrationFields: [],
    id: undefined,
    _id: undefined
  };
}

export function CreateEventPage({ onNavigate, mode = 'create', initialData }: CreateEventPageProps = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [eventData, setEventData] = useState<any>({ ...buildCreateDefaults(), ...(initialData || {}) });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast, showToast, hideToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load edit/copy data from localStorage if needed
  useEffect(() => {
    if (mode === 'edit' || mode === 'copy') {
      const mapToFormData = (parsed: Record<string, any>) => {
        const toNumericText = (value: unknown) => {
          if (value === null || value === undefined || value === '') return '';
          const numeric = Number(value);
          if (!Number.isFinite(numeric)) return '';
          return String(Math.trunc(numeric));
        };

        const normalizedEventType = String(parsed.eventType || 'individual');
        const isTeamEvent = normalizedEventType.toLowerCase().includes('team');
        const isCompetitionEvent = normalizedEventType.toLowerCase().includes('competition');
        const parsedCustomFields = parsed.customFields;
        const registrationCustomFields = Array.isArray(parsedCustomFields)
          ? parsedCustomFields
          : (Array.isArray(parsedCustomFields?.registrationFields) ? parsedCustomFields.registrationFields : []);
        const eventMeta = (!Array.isArray(parsedCustomFields) && parsedCustomFields && typeof parsedCustomFields === 'object')
          ? parsedCustomFields.eventMeta || {}
          : {};
        const derivedHasPrizes =
          typeof parsed.hasPrizes === 'boolean'
            ? parsed.hasPrizes
            : (isCompetitionEvent || Boolean((parsed.prizes || []).length));
        const safeCapacity = toNumericText(parsed.capacity ?? parsed.maxCapacity);
        const derivedShortDescription = String(
          parsed.shortDescription || parsed.description || parsed.title || 'Event details'
        ).trim();

        const mappedData: Record<string, any> = {
          ...parsed,
          eventName: parsed.eventName || parsed.title || '',
          detailedDescription: parsed.detailedDescription || parsed.description || '',
          shortDescription: derivedShortDescription,
          category: parsed.category || 'General',
          subCategory: parsed.subCategory || eventMeta.subCategory || '',
          eventType: normalizedEventType,
          hasPrizes: derivedHasPrizes,
          teamSize: {
            min: toNumericText(parsed.teamSize?.min ?? parsed.teamSizeMin),
            max: toNumericText(parsed.teamSize?.max ?? parsed.teamSizeMax),
          },
          locationType: parsed.locationType || 'physical',
          venue: parsed.venue || '',
          startDate: parsed.startDate || (parsed.date ? new Date(parsed.date).toISOString().split('T')[0] : ''),
          endDate: parsed.endDate ? new Date(parsed.endDate).toISOString().split('T')[0] : (parsed.date ? new Date(parsed.date).toISOString().split('T')[0] : ''),
          startTime: parsed.startTime || (parsed.date ? new Date(parsed.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : ''),
          endTime: parsed.endTime || '',
          capacity: toNumericText(eventMeta.venueCapacity ?? parsed.capacity),
          maxParticipants: toNumericText(parsed.maxCapacity ?? parsed.maxParticipants),
          isPaid: parsed.isPaid !== undefined ? parsed.isPaid : Number(parsed.price || 0) > 0,
          fee: parsed.fee || String(parsed.price || '0'),
          minParticipants: parsed.minParticipants || '',
          waitlistEnabled: Boolean(parsed.waitlistEnabled),
          paymentGateway: parsed.paymentGateway || 'All Methods',
          rules: parsed.rules || '',
          publishType: parsed.publishType || eventMeta.publishType || 'now',
          scheduledPublishDate: parsed.scheduledPublishDate || eventMeta.scheduledPublishDate || '',
          scheduledPublishTime: parsed.scheduledPublishTime || eventMeta.scheduledPublishTime || '',
          registrationStatus: parsed.registrationStatus || (parsed.registrationOpen ? 'open' : 'closed'),
          poster: parsed.poster || parsed.posterUrl || '',
          coordinators: parsed.coordinators || parsed.assignedCoordinators || [],
          customFields: registrationCustomFields
        };

        if (mode === 'copy') {
          delete mappedData.id;
          delete mappedData._id;
          mappedData.eventName = `${mappedData.eventName} (Copy)`;
        }

        setEventData(mappedData);
      };

      if (initialData && Object.keys(initialData).length > 0) {
        mapToFormData(initialData);
      } else {
        const savedData = localStorage.getItem('editEventData');
        if (savedData) {
          try {
            mapToFormData(JSON.parse(savedData));
          } catch (e) {
            console.error('Failed to parse edit/copy data', e);
          }
        }
      }
    } else if (mode === 'create') {
      localStorage.removeItem('editEventData'); // Clear any stale edit data
      setEventData({ ...buildCreateDefaults(), ...(initialData || {}) });
    }
  }, [mode, initialData]);

  const CurrentStepComponent = steps[currentStep - 1]?.component as any;

  const handleUpdateData = (newData: any) => {
    setEventData((prev: any) => ({ ...prev, ...newData }));
    // Clear the error for the updated fields if any
    if (Object.keys(formErrors).length > 0) {
      setFormErrors((prev: Record<string, string>) => {
        const next = { ...prev };
        Object.keys(newData).forEach(key => delete next[key]);
        return next;
      });
    }
  };

  const validateStep = (step: number) => {
    try {
      const stepFields: Record<number, string[]> = {
        1: ['eventName', 'category', 'eventType', 'shortDescription'],
        2: ['locationType', 'venue', 'capacity', 'startDate', 'startTime', 'endDate', 'endTime', 'coordinators', 'rules'],
        3: ['registrationStatus', 'maxParticipants', 'minParticipants', 'waitlistEnabled', 'isPaid', 'fee', 'paymentGateway']
      };

      const result = eventSchema.safeParse(eventData);
      const allErrors: Record<string, string> = {};

      if (!result.success) {
        result.error.issues.forEach(issue => {
          if (issue.path.length > 0) {
            allErrors[issue.path[0] as string] = issue.message;
          }
        });
      }

      const currentFields = stepFields[step] || [];
      const currentStepErrors: Record<string, string> = {};
      let hasCurrentStepError = false;

      currentFields.forEach(field => {
        if (allErrors[field]) {
          currentStepErrors[field] = allErrors[field];
          hasCurrentStepError = true;
        }
      });

      // Update formErrors to show errors ONLY for the current step
      // This prevents Step 2/3 errors from showing up prematurely
      if (hasCurrentStepError) {
        setFormErrors(currentStepErrors);
        const firstField = Object.keys(currentStepErrors)[0]!;
        showToast(`Validation Failed: ${currentStepErrors[firstField]}`, 'error');
        return false;
      }

      // If the current step is valid, clear errors to ensure the next step starts "clean"
      setFormErrors({});
      return true;
    } catch (e) {
      console.error('Validation Error:', e);
      return false;
    }
  };

  const validateAllStepsForPublish = () => {
    const result = eventSchema.safeParse(eventData);
    if (!result.success) {
      console.log("Validation errors:", result.error.format());
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        if (issue.path.length > 0) {
          formattedErrors[issue.path[0] as string] = issue.message;
        }
      });
      setFormErrors(formattedErrors);
      return "Please resolve all validation errors before publishing";
    }
    return null;
  };

  const nextStep = () => {
    if (mode !== 'edit' && mode !== 'view') {
      if (!validateStep(currentStep)) return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      if (mode !== 'view' && mode !== 'edit') {
        showToast('Progress saved', 'success');
      }
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveEvent = async (status = 'PUBLISHED') => {
    setIsSubmitting(true);
    try {
      const toText = (value: unknown, fallback = '') => {
        if (value === null || value === undefined) return fallback;
        return String(value);
      };

      if (status === 'PUBLISHED') {
        const validationError = validateAllStepsForPublish();
        if (validationError) {
          throw new Error(validationError);
        }
      }

      // Client-side validation
      const title = eventData.eventName || eventData.title || '';
      const eventDate = eventData.startDate || eventData.date || '';

      if (!title.trim() && mode !== 'edit') {
        throw new Error('Event name is required. Please fill in the Basic Details step.');
      }

      if (status === 'PUBLISHED' && !eventDate && mode !== 'edit') {
        throw new Error('Event date is required. Please fill in the Event Information step.');
      }

      const formData = new FormData();

      // Basic Details
      formData.append('title', toText(title));
      formData.append('description', toText(eventData.detailedDescription || eventData.description));
      formData.append('shortDescription', toText(eventData.shortDescription));
      formData.append('category', toText(eventData.category));
      formData.append('subCategory', toText(eventData.subCategory));
      formData.append('status', toText(status));

      // Event Type & Team Settings
      formData.append('eventType', toText(eventData.eventType, 'individual'));
      if (String(eventData.eventType || '').toLowerCase().includes('team') && eventData.teamSize) {
        formData.append('teamSizeMin', toText(eventData.teamSize.min));
        formData.append('teamSizeMax', toText(eventData.teamSize.max));
      }

      // Location & Venue
      formData.append('locationType', toText(eventData.locationType, 'physical'));
      formData.append('venue', toText(eventData.venue));
      formData.append('capacity', toText(eventData.capacity));

      // Date & Time
      formData.append('date', eventDate ? new Date(eventDate).toISOString() : new Date().toISOString());
      formData.append('startTime', toText(eventData.startTime));
      formData.append('endTime', toText(eventData.endTime));
      if (eventData.endDate) {
        formData.append('endDate', new Date(eventData.endDate).toISOString());
      }

      // Registration Settings
      formData.append('registrationStatus', toText(eventData.registrationStatus, 'open'));
      formData.append('maxParticipants', toText(eventData.maxParticipants, ''));
      formData.append('minParticipants', toText(eventData.minParticipants));
      formData.append('waitlistEnabled', eventData.waitlistEnabled ? 'true' : 'false');

      // Fee & Payment
      formData.append('isPaid', eventData.isPaid ? 'true' : 'false');
      formData.append('fee', toText(eventData.fee, '0'));
      formData.append('paymentGateway', toText(eventData.paymentGateway, 'All Methods'));

      // Media
      formData.append('posterUrl', toText(eventData.poster || eventData.posterUrl));

      // Complex Data (JSON)
      formData.append('coordinators', JSON.stringify(eventData.coordinators || []));
      formData.append('eligibility', JSON.stringify(eventData.eligibility || []));
      const registrationCustomFields = Array.isArray(eventData.customFields)
        ? eventData.customFields
        : (Array.isArray(eventData.customFields?.registrationFields) ? eventData.customFields.registrationFields : []);
      formData.append('customFields', JSON.stringify({
        registrationFields: registrationCustomFields,
        eventMeta: {
          venueCapacity: toText(eventData.capacity),
          subCategory: toText(eventData.subCategory),
          publishType: toText(eventData.publishType, 'now'),
          scheduledPublishDate: toText(eventData.scheduledPublishDate),
          scheduledPublishTime: toText(eventData.scheduledPublishTime)
        }
      }));
      formData.append('documents', JSON.stringify(eventData.documents || []));
      formData.append('rules', toText(eventData.rules));
      formData.append('hasPrizes', String(eventData.hasPrizes || false));

      // Call Server Action
      let result;
      const isUpdate = mode === 'edit' && (eventData.id || initialData?.id);

      if (isUpdate) {
        const idToUpdate = eventData.id || initialData?.id;
        formData.append('id', toText(idToUpdate));
        result = await updateEvent(formData);
      } else {
        result = await createEvent(formData);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      const successMessage = status === 'DRAFT'
        ? 'Event saved as draft successfully!'
        : (isUpdate ? 'Event updated successfully!' : 'Event published successfully!');

      showToast(successMessage, 'success');

      if (mode === 'edit' || mode === 'copy') {
        localStorage.removeItem('editEventData');
      }

      if (onNavigate) {
        // Use a short delay so the user can see the success toast before redirecting
        setTimeout(() => {
          onNavigate('all-events');
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to save event: " + (error as any).message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    await saveEvent('DRAFT');
  };

  const handlePublish = () => {
    setShowConfirm(true);
  };

  const confirmPublish = async () => {
    setShowConfirm(false);
    await saveEvent('PUBLISHED');
  };

  const getPageTitle = () => {
    if (mode === 'edit' || (eventData.id && mode !== 'create')) return 'Edit Event';
    if (mode === 'view') return 'View Event';
    return 'Create New Event';
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
              onClick={() => onNavigate ? onNavigate('all-events') : window.history.back()}
              className="p-2 hover:bg-white rounded-lg border border-[#E5E7EB] transition-colors">

              <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
            </button>
            <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A]">{getPageTitle()}</h1>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 md:p-6 mb-6 animate-card-entrance" style={{ animationDelay: '40ms' }}>
          <div className="flex items-center justify-between w-full">
            {steps.map((step: any, index: any) =>
              <div key={step.id} className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all shrink-0 ${currentStep > step.id ?
                      'bg-[#10B981] text-white' :
                      currentStep === step.id ?
                        'bg-[#1A1A1A] text-white' :
                        'bg-[#F7F8FA] text-[#6B7280] border-2 border-[#E5E7EB]'}`
                    }>

                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <div className="hidden md:block shrink-0">
                    <div
                      className={`text-sm font-semibold ${currentStep >= step.id ? 'text-[#1A1A1A]' : 'text-[#6B7280]'}`
                      }>

                      {step.name}
                    </div>
                    <div className="text-xs text-[#9CA3AF]">Step {step.id} of {steps.length}</div>
                  </div>
                </div>
                {index < steps.length - 1 &&
                  <div className="flex-1 mx-2 md:mx-4">
                    <div
                      className={`h-0.5 transition-all ${currentStep > step.id ? 'bg-[#10B981]' : 'bg-[#E5E7EB]'}`
                      }>
                    </div>
                  </div>
                }
              </div>
            )}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-[#F4F2F0] rounded-[18px] mb-6 px-3 py-6 animate-card-entrance" style={{ animationDelay: '80ms' }}>
          <div className="mb-4 pl-3">
            <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-1">{steps[currentStep - 1]?.name}</h3>
            <p className="text-xs text-[#6B7280]">
              {currentStep === 1 && "Enter the basic information about your event"}
              {currentStep === 2 && "Provide detailed information about the event"}
              {currentStep === 3 && "Configure registration and participation settings"}
              {currentStep === 4 && "Upload images, videos, and other media files"}
              {currentStep === 5 && "Review all details and publish your event"}
            </p>
          </div>

          <div className={`bg-white rounded-[14px] border border-[#E5E7EB] p-4 md:p-8 shadow-sm ${mode === 'view' ? 'pointer-events-none opacity-90' : ''}`}>
            <CurrentStepComponent
              key={`${mode}-${eventData.id || eventData._id || 'new'}-${currentStep}`}
              data={{ ...eventData, errors: formErrors }}
              updateData={handleUpdateData} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-3 sm:gap-4">
          <button
            onClick={previousStep}
            disabled={currentStep === 1}
            className={`order-1 col-span-1 flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${currentStep === 1 ?
              'bg-[#F7F8FA] text-[#9CA3AF] cursor-not-allowed' :
              'bg-white border border-[#E5E7EB] text-[#1A1A1A] hover:bg-[#F7F8FA]'}`
            }>
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {mode !== 'view' &&
            <button
              onClick={() => saveEvent('DRAFT')}
              className="order-3 col-span-2 sm:order-2 sm:ml-auto flex-1 sm:flex-none px-6 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F7F8FA] transition-colors">
              Save as Draft
            </button>
          }

          {currentStep < steps.length ?
            <button
              onClick={nextStep}
              className="order-2 col-span-1 sm:order-3 flex-1 sm:flex-none px-6 py-3 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors">
              {mode === 'view' ? 'Next' : 'Continue'}
            </button> :
            mode === 'view' ?
              <button
                onClick={() => onNavigate && onNavigate('all-events')}
                className="order-2 col-span-1 sm:order-3 flex-1 sm:flex-none px-6 py-3 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors">
                Close View
              </button> :
              <button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="order-2 col-span-1 sm:order-3 flex-1 sm:flex-none px-6 py-3 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors disabled:opacity-70 disabled:cursor-wait">
                {isSubmitting ? 'Publishing...' : (mode === 'edit' ? 'Update Event' : 'Publish Event')}
              </button>
          }
        </div>

      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmPublish}
        title={mode === 'edit' ? "Update Event?" : "Ready to Publish Your Event?"}
        message={mode === 'edit' ?
          "Are you sure you want to save changes to this event?" :
          "Your event will be visible to all students and registrations will open immediately. Are you ready to publish?"
        }
        type="success"
        cancelLabel="Cancel"
        confirmLabel={mode === 'edit' ? "Update" : "Publish"} />
    </div>);
}