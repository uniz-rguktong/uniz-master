/* eslint-disable @typescript-eslint/no-explicit-any */
import { Briefcase } from "lucide-react";

export default function TendersSection() {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200">
        <Briefcase size={48} strokeWidth={1} />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 tracking-tight">
          Tenders Module Disabled
        </p>
        <p className="text-slate-400 font-medium mt-2 max-w-sm mx-auto">
          The procurement and tenders module has been temporarily disabled as
          per system audit requirements.
        </p>
      </div>
    </div>
  );
}
