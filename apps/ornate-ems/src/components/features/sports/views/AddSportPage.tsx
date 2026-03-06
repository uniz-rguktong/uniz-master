'use client';
import { ChevronLeft } from 'lucide-react';
import { SportForm } from '../components/events/SportForm';

interface AddSportPageProps {
  onNavigate?: ((path: string, options?: Record<string, unknown>) => void) | undefined;
  mode?: string | undefined;
  initialData?: Record<string, any> | undefined;
  hideStep2Coordinators?: boolean;
  hiddenStepIds?: number[];
}

export function AddSportPage({ onNavigate, mode = 'create', initialData, hideStep2Coordinators = false, hiddenStepIds = [] }: AddSportPageProps = {}) {
  const getPageTitle = () => {
    if (mode === 'edit') return 'Edit Sport Competition';
    if (mode === 'view') return 'View Sport Details';
    return 'Add New Sport';
  };

  return (
    <div className="min-h-full bg-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8 animate-page-entrance">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
            <span>Dashboard</span>
            <span className="text-[#9CA3AF]">›</span>
            <span>Sports Management</span>
            <span className="text-[#9CA3AF]">›</span>
            <span className="text-[#1A1A1A] font-medium">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate ? onNavigate('all-sports') : window.history.back()}
              className="p-2 hover:bg-white rounded-lg border border-[#E5E7EB] transition-colors bg-white shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
            </button>
            <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A]">{getPageTitle()}</h1>
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-4 md:p-8 shadow-sm">
          <SportForm
            mode={mode}
            initialData={initialData}
            hideStep2Coordinators={hideStep2Coordinators}
            hiddenStepIds={hiddenStepIds}
            onNavigate={onNavigate}
            onSuccess={() => onNavigate?.('all-sports')}
          />
        </div>
      </div>
    </div>
  );
}
