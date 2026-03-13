'use client';
import { useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';






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
  capacity?: string;
  registrationFields?: CustomField[];
  errors?: Record<string, string>;
}

interface RegistrationSettingsStepProps {
  data: RegistrationSettingsData;
  updateData: (changes: Partial<RegistrationSettingsData>) => void;
}

export function RegistrationSettingsStep({ data, updateData }: RegistrationSettingsStepProps) {
  const [registrationStatus, setRegistrationStatus] = useState(data.registrationStatus || 'open');
  const [maxParticipants, setMaxParticipants] = useState(data.maxParticipants || '');
  const [minParticipants, setMinParticipants] = useState(data.minParticipants || '');
  const [waitlistEnabled, setWaitlistEnabled] = useState(Boolean(data.waitlistEnabled));
  const [isPaid, setIsPaid] = useState(data.isPaid || false);
  const [fee, setFee] = useState(data.fee || '');
  const [paymentGateway, setPaymentGateway] = useState(data.paymentGateway || 'All Methods');
  const [customFields, setCustomFields] = useState<CustomField[]>(
    Array.isArray(data.customFields)
      ? data.customFields
      : (Array.isArray(data.registrationFields) ? data.registrationFields : [])
  );

  const venueCapacity = useMemo(() => {
    const cap = data.capacity || '';
    return cap ? parseInt(String(cap), 10) : Infinity;
  }, [data.capacity]);

  const parsePositiveInt = (value: unknown) => {
    const parsed = parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const handleMaxParticipantsChange = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (!digitsOnly) {
      setMaxParticipants('');
      updateData({ maxParticipants: '' });
      return;
    }

    let parsed = parseInt(digitsOnly, 10);
    if (venueCapacity !== Infinity && parsed > venueCapacity) {
      parsed = venueCapacity;
    }

    const normalized = String(parsed);
    setMaxParticipants(normalized);
    updateData({ maxParticipants: normalized });
  };

  const handleMinParticipantsChange = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (!digitsOnly) {
      setMinParticipants('');
      updateData({ minParticipants: '' });
      return;
    }

    let parsed = parseInt(digitsOnly, 10);
    if (venueCapacity !== Infinity && parsed > venueCapacity) {
      parsed = venueCapacity;
    }

    const normalized = String(parsed);
    setMinParticipants(normalized);
    updateData({ minParticipants: normalized });
  };

  useEffect(() => {
    setRegistrationStatus(data.registrationStatus || 'open');
    setMaxParticipants(data.maxParticipants || '');
    setMinParticipants(data.minParticipants || '');
    setWaitlistEnabled(Boolean(data.waitlistEnabled));
    setIsPaid(Boolean(data.isPaid));
    setFee(data.fee || '');
    setPaymentGateway(data.paymentGateway || 'All Methods');
    setCustomFields(
      Array.isArray(data.customFields)
        ? data.customFields
        : (Array.isArray(data.registrationFields) ? data.registrationFields : [])
    );
  }, [
    data.registrationStatus,
    data.maxParticipants,
    data.minParticipants,
    data.waitlistEnabled,
    data.isPaid,
    data.fee,
    data.paymentGateway,
    data.customFields
  ]);

  const addCustomField = () => {
    const updated = [...customFields, { type: 'text', label: '', required: false }];
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
      i === index ? { ...field, ...changes } : field
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
            { value: 'open', label: 'Open', description: 'Anyone can register' },
            { value: 'closed', label: 'Closed', description: 'Registration not available' },
            { value: 'coming-soon', label: 'Coming Soon', description: 'Show countdown' },
            { value: 'invitation', label: 'By Invitation', description: 'Invite-only event' }].
            map(({ value, label, description }) =>
              <label
                key={value}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${registrationStatus === value ?
                  'border-[#1A1A1A] bg-[#F7F8FA]' :
                  'border-[#E5E7EB] hover:border-[#D1D5DB]'}`
                }>

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
                    className="mt-1 w-4 h-4 text-[#1A1A1A]" />

                  <div>
                    <div className="font-medium text-[#1A1A1A]">{label}</div>
                    <div className="text-xs text-[#6B7280] mt-0.5">{description}</div>
                  </div>
                </div>
              </label>
            )}
        </div>
        {data.errors?.registrationStatus && <p className="text-xs text-red-500 mt-2">{data.errors.registrationStatus}</p>}
      </div>

      {/* Capacity Management */}
      <div>
        <h3 className="text-sm font-medium text-[#1A1A1A] mb-4">Capacity Management</h3>
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
                if (['e', 'E', '+', '-', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 200"
              className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${data.errors?.maxParticipants ? 'border-red-500' : 'border-[#E5E7EB]'}`} />
            {data.errors?.maxParticipants && <p className="text-xs text-red-500 mt-1">{data.errors.maxParticipants}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-2">
              Minimum Participants (optional)
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={minParticipants}
              onChange={(e) => {
                handleMinParticipantsChange(e.target.value);
              }}
              onKeyDown={(e) => {
                if (['e', 'E', '+', '-', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 50"
              className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />

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
        <h3 className="text-sm font-medium text-[#1A1A1A] mb-4">Registration Fee</h3>
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
              className="w-4 h-4 text-[#1A1A1A]" />

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
              className="w-4 h-4 text-[#1A1A1A]" />

            <div>
              <div className="font-medium text-[#1A1A1A]">Paid Event</div>
              <div className="text-xs text-[#6B7280]">Charge registration fee</div>
            </div>
          </label>
        </div>

        {isPaid &&
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-2">Amount</label>
                <div className="flex gap-2">
                  <select className="px-3 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]">
                    <option>$</option>
                    <option>₹</option>
                    <option>€</option>
                  </select>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={fee}
                    onChange={(e) => {
                      setFee(e.target.value);
                      updateData({ fee: e.target.value });
                    }}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    className="flex-1 px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />

                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-2">Payment Gateway</label>
                <select
                  value={paymentGateway}
                  onChange={(e) => {
                    setPaymentGateway(e.target.value);
                    updateData({ paymentGateway: e.target.value });
                  }}
                  className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]">
                  <option>UPI</option>
                  <option>Credit/Debit Card</option>
                  <option>Net Banking</option>
                  <option>All Methods</option>
                </select>
              </div>
            </div>


          </div>
        }
      </div>
    </div>);

}