"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";

interface CustomField {
  type: string;
  label: string;
  required: boolean;
}

interface RegistrationSettingsData {
  registrationStatus?: string;
  maxParticipants?: string;
  minParticipants?: string;
  waitlistEnabled?: boolean;
  isPaid?: boolean;
  fee?: string;
  paymentGateway?: string;
  customFields?: CustomField[];
}

interface RegistrationSettingsStepProps {
  data: RegistrationSettingsData;
  updateData: (changes: Partial<RegistrationSettingsData>) => void;
}

export function RegistrationSettingsStep({
  data,
  updateData,
}: RegistrationSettingsStepProps) {
  const [registrationStatus, setRegistrationStatus] = useState(
    data.registrationStatus || "open",
  );
  const [maxParticipants, setMaxParticipants] = useState(
    data.maxParticipants ||
      (data as any).capacity ||
      (data as any).maxCapacity ||
      "",
  );
  const [minParticipants, setMinParticipants] = useState(
    data.minParticipants || "",
  );
  const [waitlistEnabled, setWaitlistEnabled] = useState(
    Boolean(data.waitlistEnabled),
  );
  const [isPaid, setIsPaid] = useState(data.isPaid || false);
  const [fee, setFee] = useState(data.fee || "");
  const [paymentGateway, setPaymentGateway] = useState(
    data.paymentGateway || "All Methods",
  );
  const [customFields, setCustomFields] = useState<CustomField[]>(
    Array.isArray(data.customFields)
      ? data.customFields
      : Array.isArray((data.customFields as any)?.registrationFields)
        ? (data.customFields as any).registrationFields
        : [],
  );

  const parsePositiveInt = (value: unknown) => {
    const parsed = parseInt(String(value ?? ""), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const handleMaxParticipantsChange = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, "");
    if (!digitsOnly) {
      setMaxParticipants("");
      updateData({ maxParticipants: "" });
      return;
    }

    const parsed = parseInt(digitsOnly, 10);
    const normalized = String(Math.max(parsed, 1));
    setMaxParticipants(normalized);
    updateData({ maxParticipants: normalized });
  };

  useEffect(() => {
    setRegistrationStatus(data.registrationStatus || "open");
    setMaxParticipants(data.maxParticipants || "");
    setMinParticipants(data.minParticipants || "");
    setWaitlistEnabled(Boolean(data.waitlistEnabled));
    setIsPaid(Boolean(data.isPaid));
    setFee(data.fee || "");
    setPaymentGateway(data.paymentGateway || "All Methods");
    setCustomFields(
      Array.isArray(data.customFields)
        ? data.customFields
        : Array.isArray((data.customFields as any)?.registrationFields)
          ? (data.customFields as any).registrationFields
          : [],
    );
  }, [
    data.registrationStatus,
    data.maxParticipants,
    data.minParticipants,
    data.waitlistEnabled,
    data.isPaid,
    data.fee,
    data.paymentGateway,
    data.customFields,
  ]);

  const addCustomField = () => {
    const updated = [
      ...customFields,
      { type: "text", label: "", required: false },
    ];
    setCustomFields(updated);
    updateData({ customFields: updated });
  };

  const removeCustomField = (index: number) => {
    const updated = customFields.filter((_, i) => i !== index);
    setCustomFields(updated);
    updateData({ customFields: updated });
  };

  const updateCustomField = (index: number, changes: Partial<CustomField>) => {
    const updated = customFields.map((field, i) =>
      i === index ? { ...field, ...changes } : field,
    );
    setCustomFields(updated);
    updateData({ customFields: updated });
  };

  return (
    <div className="space-y-8">
      {/* Registration Status */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-3">
          Registration Status <span className="text-[#EF4444]">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              value: "open",
              label: "Open",
              description: "Anyone can register",
            },
            {
              value: "closed",
              label: "Closed",
              description: "Registration not available",
            },
            {
              value: "coming-soon",
              label: "Coming Soon",
              description: "Show countdown",
            },
            {
              value: "invitation",
              label: "By Invitation",
              description: "Invite-only event",
            },
          ].map(({ value, label, description }) => (
            <label
              key={value}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                registrationStatus === value
                  ? "border-[#1A1A1A] bg-[#F7F8FA]"
                  : "border-[#E5E7EB] hover:border-[#D1D5DB]"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="registrationStatus"
                  value={value}
                  checked={registrationStatus === value}
                  onChange={(e) => {
                    setRegistrationStatus(e.target.value);
                    updateData({ registrationStatus: e.target.value });
                  }}
                  className="mt-1 w-4 h-4 text-[#1A1A1A]"
                />

                <div>
                  <div className="font-medium text-[#1A1A1A]">{label}</div>
                  <div className="text-xs text-[#6B7280] mt-0.5">
                    {description}
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Capacity Management */}
      <div>
        <h3 className="text-sm font-medium text-[#1A1A1A] mb-4">
          Capacity Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-2">
              Maximum Participants <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={maxParticipants}
              onChange={(e) => {
                handleMaxParticipantsChange(e.target.value);
              }}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-"].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              placeholder="e.g., 200"
              className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-2">
              Minimum Participants (optional)
            </label>
            <input
              type="number"
              value={minParticipants}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, "");
                setMinParticipants(digitsOnly);
                updateData({ minParticipants: digitsOnly });
              }}
              placeholder="e.g., 50"
              className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            />
          </div>
        </div>

        {/* Waitlist */}
        <div className="mt-4 p-4 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div className="flex-1">
              <div className="font-medium text-[#1A1A1A]">Enable Waitlist</div>
              <div className="text-xs text-[#6B7280] mt-1">
                Allow participants to join waitlist when event is full
              </div>
            </div>
            <input
              type="checkbox"
              checked={waitlistEnabled}
              onChange={(e) => {
                setWaitlistEnabled(e.target.checked);
                updateData({ waitlistEnabled: e.target.checked });
              }}
              className="w-5 h-5 rounded border-[#E5E7EB] shrink-0 text-[#1A1A1A] focus:ring-[#1A1A1A]"
            />
          </label>
        </div>
      </div>

      {/* Registration Fee */}
      <div>
        <h3 className="text-sm font-medium text-[#1A1A1A] mb-4">
          Registration Fee
        </h3>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer flex-1 transition-all hover:border-[#D1D5DB]">
            <input
              type="radio"
              name="isPaid"
              checked={!isPaid}
              onChange={() => {
                setIsPaid(false);
                updateData({ isPaid: false });
              }}
              className="w-4 h-4 text-[#1A1A1A]"
            />

            <div>
              <div className="font-medium text-[#1A1A1A]">Free Event</div>
              <div className="text-xs text-[#6B7280]">No registration fee</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer flex-1 transition-all hover:border-[#D1D5DB]">
            <input
              type="radio"
              name="isPaid"
              checked={isPaid}
              onChange={() => {
                setIsPaid(true);
                updateData({ isPaid: true });
              }}
              className="w-4 h-4 text-[#1A1A1A]"
            />

            <div>
              <div className="font-medium text-[#1A1A1A]">Paid Event</div>
              <div className="text-xs text-[#6B7280]">
                Charge registration fee
              </div>
            </div>
          </label>
        </div>

        {isPaid && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-2">
                  Amount
                </label>
                <div className="flex gap-2">
                  <select className="px-3 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]">
                    <option>$</option>
                    <option>₹</option>
                    <option>€</option>
                  </select>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => {
                      setFee(e.target.value);
                      updateData({ fee: e.target.value });
                    }}
                    placeholder="0.00"
                    className="flex-1 px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-2">
                  Payment Gateway
                </label>
                <select
                  value={paymentGateway}
                  onChange={(e) => {
                    setPaymentGateway(e.target.value);
                    updateData({ paymentGateway: e.target.value });
                  }}
                  className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                >
                  <option>UPI</option>
                  <option>Credit/Debit Card</option>
                  <option>Net Banking</option>
                  <option>All Methods</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Registration Fields */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[#1A1A1A]">
            Custom Registration Fields
          </h3>
          <button
            onClick={addCustomField}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#F7F8FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#1A1A1A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div className="p-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-xs text-[#6B7280]">
            Default fields: Full Name, Roll Number, Email, Phone Number, Branch,
            Year
          </div>

          {customFields.map((field: any, index: any) => (
            <div
              key={index}
              className="p-4 border border-[#E5E7EB] rounded-lg bg-white"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 flex flex-col md:flex-row gap-3">
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateCustomField(index, { type: e.target.value })
                    }
                    className="w-full md:w-auto px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                  >
                    <option value="text">Text Input</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="radio">Radio Buttons</option>
                    <option value="checkbox">Checkboxes</option>
                    <option value="file">File Upload</option>
                    <option value="textarea">Text Area</option>
                  </select>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) =>
                      updateCustomField(index, { label: e.target.value })
                    }
                    placeholder="Field Label (e.g., T-shirt Size)"
                    className="flex-1 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                  />
                </div>
                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      updateCustomField(index, { required: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-[#E5E7EB] text-[#1A1A1A]"
                  />
                  <span className="text-xs text-[#6B7280]">Required</span>
                </label>
                <button
                  onClick={() => removeCustomField(index)}
                  className="p-2 hover:bg-[#FEE2E2] hover:text-[#EF4444] rounded transition-colors group"
                >
                  <X className="w-4 h-4 text-[#6B7280] group-hover:text-[#EF4444]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Settings */}
      {!isPaid && (
        <div>
          <h3 className="text-sm font-medium text-[#1A1A1A] mb-4">
            Confirmation Settings
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-lg">
              <div>
                <div className="font-medium text-[#1A1A1A]">
                  Auto-Confirmation
                </div>
                <div className="text-xs text-[#6B7280] mt-1">
                  Automatically confirm registrations
                </div>
              </div>
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-[#E5E7EB]"
                defaultChecked
              />
            </label>

            <label className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-lg">
              <div>
                <div className="font-medium text-[#1A1A1A]">
                  Send Confirmation Email
                </div>
                <div className="text-xs text-[#6B7280] mt-1">
                  Email confirmation to participants
                </div>
              </div>
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-[#E5E7EB]"
                defaultChecked
              />
            </label>

            <label className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-lg">
              <div>
                <div className="font-medium text-[#1A1A1A]">
                  Send SMS Notification
                </div>
                <div className="text-xs text-[#6B7280] mt-1">
                  SMS confirmation to participants
                </div>
              </div>
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-[#E5E7EB]"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
