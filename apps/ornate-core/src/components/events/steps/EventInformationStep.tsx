'use client';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { MapPin, Calendar, Plus, X, User } from 'lucide-react';
import { InfoTooltip } from '../../InfoTooltip';
import { Modal } from '../../Modal';
import { useCoordinators } from '../../../context/CoordinatorContext';

interface Coordinator {
  name: string;
  email: string;
  phone: string;
  assignedEvent?: string;
  isPrimary?: boolean;
}

interface EventInformationData {
  eventName?: string;
  category?: string;
  locationType?: string;
  venue?: string;
  capacity?: string;
  maxParticipants?: string;
  date?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  coordinators?: Coordinator[];
  assignedCoordinators?: any[];
  eligibility?: string[];
  rules?: string;
  errors?: Record<string, string>;
}

interface EventInformationStepProps {
  data: EventInformationData;
  updateData: (changes: Partial<EventInformationData>) => void;
}

export function EventInformationStep({ data, updateData }: EventInformationStepProps) {
  const [locationType, setLocationType] = useState(data.locationType || 'physical');
  const [venue, setVenue] = useState(data.venue || '');
  const [capacity, setCapacity] = useState(data.capacity || '');
  const [startDate, setStartDate] = useState(data.startDate || (data.date ? new Date(data.date).toISOString().split('T')[0] : ''));
  const [startTime, setStartTime] = useState(data.startTime || (data.date ? new Date(data.date).toTimeString().slice(0, 5) : ''));
  const [endDate, setEndDate] = useState(data.endDate || (data.date ? new Date(data.date).toISOString().split('T')[0] : ''));
  const [endTime, setEndTime] = useState(data.endTime || (data.date ? new Date(new Date(data.date).getTime() + 3600000).toTimeString().slice(0, 5) : ''));
  const [coordinators, setCoordinators] = useState<Coordinator[]>(data.coordinators || []);
  const [eligibility, setEligibility] = useState<string[]>(data.eligibility || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const isSportsCategory = String(data.category || '').trim().toLowerCase() === 'sports';

  const hasBothDates = Boolean(startDate && endDate);
  const isStartDateAfterEndDate = startDate && endDate
    ? new Date(startDate) > new Date(endDate)
    : false;
  const isSameDayInvalidTime =
    hasBothDates &&
    startDate === endDate &&
    Boolean(startTime && endTime) &&
    startTime >= endTime;

  const { addCoordinator } = useCoordinators();

  useEffect(() => {
    setLocationType(data.locationType || 'physical');
    setVenue(data.venue || '');
    setCapacity(data.capacity || '');
    setStartDate(data.startDate || (data.date ? new Date(data.date).toISOString().split('T')[0] : ''));
    setStartTime(data.startTime || (data.date ? new Date(data.date).toTimeString().slice(0, 5) : ''));
    setEndDate(data.endDate || (data.date ? new Date(data.date).toISOString().split('T')[0] : ''));
    setEndTime(data.endTime || (data.date ? new Date(new Date(data.date).getTime() + 3600000).toTimeString().slice(0, 5) : ''));
    setCoordinators(data.coordinators || []);
    setEligibility(data.eligibility || []);
  }, [
    data.locationType,
    data.venue,
    data.capacity,
    data.startDate,
    data.date,
    data.startTime,
    data.endDate,
    data.endTime,
    data.coordinators,
    data.eligibility
  ]);

  const handleAddCoordinator = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const phone = String(formData.get('phone') || '');
    const normalizedPhone = phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(normalizedPhone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    const newCoordData = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      phone: normalizedPhone,
      assignedEvent: data.eventName || 'New Event'
    };

    // Add to local event state
    const newCoordinator = {
      ...newCoordData,
      isPrimary: coordinators.length === 0
    };
    const updated = [...coordinators, newCoordinator];
    setCoordinators(updated);
    updateData({ coordinators: updated });

    // Register globally in Coordinator Management
    addCoordinator(newCoordData);

    setShowAddModal(false);
  };

  const removeCoordinator = (index: number) => {
    const updated = coordinators.filter((_, i) => i !== index);
    setCoordinators(updated);
    updateData({ coordinators: updated });
  };

  const handleCapacityChange = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (!digitsOnly) {
      setCapacity('');
      updateData({ capacity: '' });
      return;
    }

    const parsed = parseInt(digitsOnly, 10);
    const normalized = String(Math.max(parsed, 1));
    setCapacity(normalized);
    updateData({ capacity: normalized });
  };

  return (
    <div className="space-y-8">
      {/* Location Type */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-3">
          Location Type <span className="text-[#EF4444]">*</span>
        </label>
        <div className="flex flex-col md:flex-row gap-4">
          {[
            { value: 'physical', label: 'Physical Location', icon: MapPin },
            { value: 'online', label: 'Online Event', icon: Calendar },
            { value: 'hybrid', label: 'Hybrid', icon: MapPin }].
            map(({ value, label, icon: Icon }) =>
              <label
                key={value}
                className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${locationType === value ?
                  'border-[#1A1A1A] bg-[#F7F8FA]' :
                  'border-[#E5E7EB] hover:border-[#D1D5DB]'}`
                }>

                <input
                  type="radio"
                  name="locationType"
                  value={value}
                  checked={locationType === value}
                  onChange={(e) => {
                    setLocationType(e.target.value);
                    updateData({ locationType: e.target.value });
                  }}
                  className="w-4 h-4 text-[#1A1A1A]" />

                <Icon className="w-5 h-5 text-[#6B7280]" />
                <span className="font-medium text-[#1A1A1A]">{label}</span>
              </label>
            )}
        </div>
      </div>

      {/* Venue Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
            Venue Name <span className="text-[#EF4444]">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              value={venue}
              onChange={(e) => {
                setVenue(e.target.value);
                updateData({ venue: e.target.value });
              }}
              placeholder="e.g., Campus Auditorium, Hall A"
              className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] ${data.errors?.venue ? 'border-red-500' : 'border-[#E5E7EB]'}`} />
          </div>
          {data.errors?.venue && <p className="text-xs text-red-500 mt-1">{data.errors.venue}</p>}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A] mb-2">
            Venue Capacity
            <InfoTooltip text="Leave this field empty if the event has unlimited capacity." />
          </label>
          <input
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={capacity}
            onChange={(e) => {
              handleCapacityChange(e.target.value);
            }}
            onKeyDown={(e) => {
              if (['e', 'E', '+', '-', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
              }
            }}
            onWheel={(e) => e.currentTarget.blur()}
            placeholder="Maximum participants"
            className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />

        </div>
      </div>

      {/* Date & Time */}
      <div>
        <h3 className="text-sm font-medium text-[#1A1A1A] mb-4">
          Date & Time <span className="text-[#EF4444]">*</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-2">Event Start</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    updateData({ startDate: e.target.value });
                  }}
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] ${data.errors?.startDate ? 'border-red-500' : 'border-[#E5E7EB]'}`} />
                {data.errors?.startDate && <p className="text-xs text-red-500 mt-1">{data.errors.startDate}</p>}
              </div>

              <div>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    updateData({ startTime: e.target.value });
                  }}
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] ${data.errors?.startTime ? 'border-red-500' : 'border-[#E5E7EB]'}`} />
                {data.errors?.startTime && <p className="text-xs text-red-500 mt-1">{data.errors.startTime}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-2">Event End</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    updateData({ endDate: e.target.value });
                  }}
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] ${data.errors?.endDate ? 'border-red-500' : 'border-[#E5E7EB]'}`} />
                {data.errors?.endDate && <p className="text-xs text-red-500 mt-1">{data.errors.endDate}</p>}
              </div>

              <div>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    updateData({ endTime: e.target.value });
                  }}
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] ${data.errors?.endTime ? 'border-red-500' : 'border-[#E5E7EB]'}`} />
                {data.errors?.endTime && <p className="text-xs text-red-500 mt-1">{data.errors.endTime}</p>}
              </div>
            </div>
          </div>
        </div>
        {startDate && endDate && startTime && endTime &&
          <div className="mt-2 text-xs text-[#6B7280]">
            Duration: Auto-calculated based on start and end times
          </div>
        }
        {isStartDateAfterEndDate && (
          <div className="mt-2 text-[11px] font-medium text-[#DC2626]">
            Start date should be less than or equal to end date.
          </div>
        )}
        {isSameDayInvalidTime && (
          <div className="mt-2 text-[11px] font-medium text-[#DC2626]">
            If start date and end date are the same, start time should be less than end time.
          </div>
        )}
      </div>

      {/* Event Coordinators */}
      {!isSportsCategory && <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-[#1A1A1A]">
            Event Coordinators <span className="text-[#EF4444]">*</span>
          </label>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#1A1A1A] transition-colors">
            <Plus className="w-4 h-4" />
            Add Coordinator
          </button>
        </div>

        {coordinators.length === 0 && (
          <div className="mb-3 p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg">
            <p className="text-xs text-[#92400E]">
              ⚠️ At least one coordinator is required to publish this event. Coordinators will receive an email invitation.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {coordinators.map((coord: any, index: any) => (
            <div key={index} className="p-4 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#1A1A1A]">{coord.name}</div>
                  <div className="text-xs text-[#6B7280]">{coord.email} • {coord.phone}</div>
                  {coord.isPrimary && (
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 bg-[#DBEAFE] text-[#1E40AF] text-xs font-medium rounded">
                        Primary Coordinator
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeCoordinator(index)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-[#6B7280]" />
                </button>
              </div>
            </div>
          ))}

          {coordinators.length === 0 && (
            <div className="text-center py-6 border-2 border-dashed border-[#E5E7EB] rounded-lg">
              <User className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
              <p className="text-sm text-[#6B7280]">No coordinators added yet</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Click "Add Coordinator" to invite someone</p>
            </div>
          )}
          {data.errors?.coordinators && <p className="text-xs text-red-500 mt-2">{data.errors.coordinators}</p>}
        </div>
      </div>}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Event Coordinator"
      >
        <div className="mb-4 p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg">
          <p className="text-xs text-[#1E40AF]">
            📧 An email invitation will be sent to the coordinator when this event is published.
          </p>
        </div>
        <form onSubmit={handleAddCoordinator} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Coordinator Name</label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Email Address</label>
            <input
              name="email"
              type="email"
              required
              placeholder="rahul@college.edu"
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Phone Number</label>
            <input
              name="phone"
              type="tel"
              required
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              onInput={(e) => {
                const input = e.currentTarget as HTMLInputElement;
                input.value = input.value.replace(/\D/g, '').slice(0, 10);
              }}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-5 py-2 rounded-[12px] text-sm font-medium text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1A1A1A] text-white rounded-[12px] text-sm font-medium hover:bg-[#2D2D2D] transition-colors"
            >
              Add Coordinator
            </button>
          </div>
        </form>
      </Modal>

      {/* Eligibility Criteria */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-3">
            Academic Eligibility
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F7F8FA] transition-colors bg-white">
              <input
                type="checkbox"
                checked={eligibility.includes('All Years')}
                onChange={(e) => {
                  let newEligibility;
                  if (e.target.checked) {
                    newEligibility = ['All Years', 'First Year', 'Second Year', 'Third Year', 'Final Year', ...eligibility.filter(i => i.includes('Branch') || i.includes('Alumni'))];
                  } else {
                    newEligibility = eligibility.filter(i => !['All Years', 'First Year', 'Second Year', 'Third Year', 'Final Year'].includes(i));
                  }
                  setEligibility(newEligibility);
                  updateData({ eligibility: newEligibility });
                }}
                className="w-4 h-4 rounded border-[#E5E7EB] text-[#1A1A1A]" />
              <span className="text-sm font-semibold text-[#1A1A1A]">All Years</span>
            </label>

            {['First Year', 'Second Year', 'Third Year', 'Final Year'].map((year) => (
              <label key={year} className={`flex items-center gap-2 p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F7F8FA] transition-colors ${eligibility.includes('All Years') ? 'opacity-50 cursor-not-allowed bg-[#F9FAFB]' : 'bg-white'}`}>
                <input
                  type="checkbox"
                  disabled={eligibility.includes('All Years')}
                  checked={eligibility.includes(year)}
                  onChange={(e) => {
                    const newElig = e.target.checked ? [...eligibility, year] : eligibility.filter(i => i !== year);
                    setEligibility(newElig);
                    updateData({ eligibility: newElig });
                  }}
                  className="w-4 h-4 rounded border-[#E5E7EB] text-[#1A1A1A]" />
                <span className="text-sm text-[#1A1A1A]">{year}</span>
              </label>
            ))}
          </div>
        </div>

      </div>

      {/* Event Rules */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
          Event Rules & Guidelines <span className="text-[#EF4444]">*</span>
        </label>
        <textarea
          rows={10}
          defaultValue={data.rules || `1. Participants must bring their college ID cards.
2. Event starts promptly at scheduled time.
3. Decision of the organizers/judges will be final.
4. Plagiarism of any kind will result in immediate disqualification.
5. Use of unfair means is strictly prohibited.`}
          onChange={(e) => updateData({ rules: e.target.value })}
          placeholder="Enter event rules and guidelines..."
          className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] resize-none" />
      </div>

    </div>);

}