'use client';

import { memo } from 'react';

export const StepCrumb = memo(({ step, active, done, label, color }: { step: number; active: boolean; done: boolean; label: string; color: string }) => (
  <span className={`flex items-center gap-1 ${active ? color : done ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black border ${active ? 'border-current bg-current/10' : 'border-gray-800 bg-transparent'}`}>
      {step}
    </span>
    {label}
  </span>
));
StepCrumb.displayName = 'StepCrumb';

export const SubPill = memo(({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color: string }) => (
  <button onClick={onClick}
    style={{ clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}
    className={`px-5 py-2 text-[10px] font-black tracking-widest uppercase border transition-all duration-150 ${active ? 'bg-white/10 border-white/30 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'} ${color}`}>
    {label}
  </button>
));
SubPill.displayName = 'SubPill';
