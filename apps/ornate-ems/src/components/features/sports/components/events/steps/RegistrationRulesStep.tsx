'use client';
import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Calendar, Users, ShieldCheck, FileText, User, Plus, X } from 'lucide-react';
import { Modal } from '@/components/Modal';

interface Coordinator {
  name: string;
  email: string;
  role: string;
  assignedSport?: string;
  isPrimary?: boolean;
}

interface RegistrationRulesData {
  deadline?: string;
  minPlayers?: number;
  maxPlayers?: number;
  maxTeamsPerBranch?: number;
  eligibility?: string[];
  rules?: string;
  coordinators?: Coordinator[];
  sportName?: string;
}

interface RegistrationRulesStepProps {
  data: RegistrationRulesData;
  updateData: (patch: Partial<RegistrationRulesData>) => void;
  hideCoordinatorSection?: boolean;
}

export function RegistrationRulesStep({ data, updateData, hideCoordinatorSection = false }: RegistrationRulesStepProps) {
  const [deadline, setDeadline] = useState(data.deadline || '');
  const [maxTeamsPerBranch, setMaxTeamsPerBranch] = useState(data.maxTeamsPerBranch || 1);
  const [eligibility, setEligibility] = useState(data.eligibility || []);
  const [rules, setRules] = useState(data.rules || '');
  const [showAddModal, setShowAddModal] = useState(false);

  const [coordinators, setCoordinators] = useState(data.coordinators || []);


  useEffect(() => {
    setDeadline(data.deadline || '');
    setMaxTeamsPerBranch(data.maxTeamsPerBranch || 1);
    setEligibility(data.eligibility || []);
    setRules(data.rules || '');
    setCoordinators(data.coordinators || []);
  }, [data]);

  /* Removed problematic useCoordinators context hook as state is lifted or local here */
  /* const { addCoordinator } = useCoordinators(); */

  const handleAddCoordinator = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCoordData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
      assignedSport: data.sportName || 'New Sport'
    };

    const newCoordinator = {
      ...newCoordData,
      isPrimary: coordinators.length === 0
    };
    const updated = [...coordinators, newCoordinator];
    setCoordinators(updated);
    updateData({ coordinators: updated });
    // addCoordinator(newCoordData);
    setShowAddModal(false);
  };

  const removeCoordinator = (index: number) => {
    const updated = coordinators.filter((_, i) => i !== index);
    setCoordinators(updated);
    updateData({ coordinators: updated });
  };

  const eligibilityOptions = [
    'All Years', '1st Year only', '2nd Year only', '3rd Year only', 'Final Year only',
    'Open to Boys', 'Open to Girls', 'Inter-Branch Only', 'Inter-College allowed'
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registration Deadline */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
            Registration Deadline <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => {
              setDeadline(e.target.value);
              updateData({ deadline: e.target.value });
            }}
            className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent shadow-sm" />
        </div>

        {/* Teams per Branch */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
            Max Teams per Branch <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={maxTeamsPerBranch}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : parseInt(e.target.value);
              setMaxTeamsPerBranch(val === '' ? 1 : val);
              if (val !== '' && !isNaN(val)) {
                updateData({ maxTeamsPerBranch: val });
              }
            }}
            className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent shadow-sm" />
        </div>
      </div>

      {/* Eligibility Options */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-4">
          Participation Eligibility
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {eligibilityOptions.map((option: any) => (
            <label
              key={option}
              className={`px-4 py-3 rounded-xl border transition-all cursor-pointer ${eligibility.includes(option)
                ? 'border-[#1A1A1A] bg-[#1A1A1A]/5'
                : 'border-[#E5E7EB] bg-white hover:border-[#1A1A1A]/30 hover:bg-[#F9FAFB]'
                }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={eligibility.includes(option)}
                  onChange={() => {
                    const newElig = eligibility.includes(option)
                      ? eligibility.filter(i => i !== option)
                      : [...eligibility, option];
                    setEligibility(newElig);
                    updateData({ eligibility: newElig });
                  }}
                  className="h-4 w-4 rounded border-[#D1D5DB] text-[#1A1A1A] focus:ring-[#1A1A1A]"
                />
                <span className={`text-xs font-semibold ${eligibility.includes(option) ? 'text-[#1A1A1A]' : 'text-[#6B7280]'}`}>
                  {option}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Rules and Guidelines */}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
          Competition Rules & Regulations
        </label>
        <textarea
          rows={6}
          value={rules}
          onChange={(e) => {
            setRules(e.target.value);
            updateData({ rules: e.target.value });
          }}
          placeholder="Enter detailed game rules, equipment requirements, disciplinary actions..."
          className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent shadow-sm resize-none" />
      </div>

      {!hideCoordinatorSection && (
        <>
          {/* Sports Coordinators */}
          <div className="bg-[#F4F2F0] rounded-[18px] p-1 flex flex-col">
            <div className="flex items-center justify-between my-2 px-3">
              <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest opacity-80">
                Coordinators
              </h3>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-xs font-semibold hover:bg-[#2D2D2D] transition-colors shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New
              </button>
            </div>

            <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {coordinators.map((coord: any, index: any) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E5E7EB] group hover:border-[#1A1A1A]/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center font-semibold text-[#1A1A1A] text-sm">
                        {coord.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#1A1A1A] leading-tight mb-0.5">{coord.name}</div>
                        <div className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider">{coord.role}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCoordinator(index)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#EF4444] hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {coordinators.length === 0 && (
                  <div className="col-span-2 py-6 flex flex-col items-center justify-center text-[#9CA3AF]">
                    <User className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-xs font-medium uppercase tracking-wider">No coordinators assigned</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Add Sport Coordinator"
          >
            <form onSubmit={handleAddCoordinator} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-2">Full Name</label>
                <input name="name" type="text" required placeholder="Coordinator Name" className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-2">College Email</label>
                <input name="email" type="email" required placeholder="email@college.edu" className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-2">Designation/Role</label>
                <input name="role" type="text" required placeholder="e.g. Physical Director, Student Lead" className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A] outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 rounded-lg text-sm font-semibold text-[#6B7280] hover:bg-[#F3F4F6] transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-semibold hover:bg-[#2D2D2D] transition-colors shadow-sm">Assign</button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
}