'use client';
import { useState } from 'react';
import Image from 'next/image';
import { CheckCircle, AlertCircle, Smartphone, Monitor, Rocket, Calendar, MapPin, Trophy } from 'lucide-react';

interface ReviewCoordinator {
   name: string;
}

interface ReviewLaunchData {
   sportName?: string;
   category?: string;
   deadline?: string;
   winnerPoints?: number;
   tournamentType?: string;
   format?: string;
   poster?: string;
   bannerUrl?: string;
   coordinators?: ReviewCoordinator[];
   genderType?: string;
}

interface ReviewLaunchStepProps {
   data: ReviewLaunchData;
}

export function ReviewLaunchStep({ data }: ReviewLaunchStepProps) {
   const [previewDevice, setPreviewDevice] = useState('desktop');

   const checklistItems = [
      { label: 'Sport Identity & Category Set', completed: !!data.sportName && !!data.category },
      { label: 'Registration Rules & Deadlines Valid', completed: !!data.deadline },
      { label: 'Points System & Awards Configured', completed: !!data.winnerPoints },
      { label: 'Brackets Format Selected', completed: !!(data.format || data.tournamentType) },
      { label: 'Tournament Poster & Media Ready', completed: !!(data.bannerUrl || data.poster) || true }, // Placeholder true
      { label: 'Primary Coordinator Assigned', completed: (data.coordinators?.length ?? 0) > 0 }
   ];

   return (
      <div className="space-y-8 animate-fade-in">
         {/* Launch Checklist */}
         <div>
            <div className="flex items-center gap-2 mb-4 px-1">
               <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest opacity-80">Pre-Launch Verification</h3>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {checklistItems.map((item: any, index: any) => (
                     <div key={index} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${item.completed ? 'bg-white border-emerald-100/60 shadow-sm' : 'bg-amber-50/50 border-amber-100/60'
                        }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${item.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-100/80 text-amber-600'
                           }`}>
                           {item.completed ? <CheckCircle className="w-4 h-4 stroke-[2px]" /> : <AlertCircle className="w-4 h-4 stroke-[2px] animate-pulse" />}
                        </div>
                        <span className={`text-xs font-semibold ${item.completed ? 'text-[#1A1A1A]' : 'text-amber-800'
                           }`}>{item.label}</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Live Preview */}
         <div>
            <div className="flex items-center justify-between mb-4 px-1">
               <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest opacity-80">Card Preview (Live)</h3>
               </div>
               <div className="flex bg-[#F4F2F0] p-1 rounded-lg border border-[#E5E7EB]">
                  <button onClick={() => setPreviewDevice('desktop')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${previewDevice === 'desktop' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#7A7772] opacity-60'}`}>Desktop</button>
                  <button onClick={() => setPreviewDevice('mobile')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${previewDevice === 'mobile' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#7A7772] opacity-60'}`}>Mobile</button>
               </div>
            </div>

            <div className="flex justify-center p-8 bg-[#F4F2F0] rounded-[24px] border border-[#E5E7EB] shadow-inner relative overflow-hidden group">
               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
               <div className={`transition-all duration-700 ease-out ${previewDevice === 'mobile' ? 'w-[280px]' : 'w-full max-w-[360px]'}`}>
                  {/* This mimics the SportCard UI */}
                  <div className="bg-white rounded-[20px] overflow-hidden shadow-xl border border-[#E5E7EB]">
                     <div className="relative aspect-video bg-[#F1F3F5]">
                        <Image
                           src={data.bannerUrl || data.poster || "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800&q=80"}
                           alt="Sport Preview"
                           fill
                           className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute top-4 right-4 px-2.5 py-1 bg-black/60 rounded-lg text-[8px] font-bold text-white uppercase tracking-widest border border-white/20">
                           {data.genderType || 'MALE'}
                        </div>
                        <div className="absolute bottom-4 left-4 px-2.5 py-1 bg-white rounded-lg text-[8px] font-bold text-[#1A1A1A] uppercase tracking-widest shadow-sm">
                           {data.category || 'INDOOR'}
                        </div>
                     </div>
                     <div className="p-5">
                        <h4 className="text-lg font-bold text-[#1A1A1A] leading-tight mb-4 tracking-tight">{data.sportName || 'Tournament Preview'}</h4>
                        <div className="grid grid-cols-2 gap-4 mb-5">
                           <div className="flex items-center gap-2 text-[#7A7772]">
                              <Calendar className="w-3 h-3 opacity-60" />
                              <span className="text-[10px] font-medium font-geist">Ends Nov 15</span>
                           </div>
                           <div className="flex items-center gap-2 text-[#7A7772]">
                              <MapPin className="w-3 h-3 opacity-60" />
                              <span className="text-[10px] font-medium font-geist truncate">{(data.format || data.tournamentType || 'Format TBD').replaceAll('_', ' ')}</span>
                           </div>
                        </div>
                        <div className="pt-4 border-t border-[#F1F3F5] flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100/50">
                                 <Trophy className="w-3.5 h-3.5 text-amber-500 stroke-[2px]" />
                              </div>
                              <span className="text-[10px] font-bold text-[#1A1A1A] tracking-tight">{data.winnerPoints || '0'} Points</span>
                           </div>
                           <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-bold uppercase tracking-widest border border-emerald-100/50 shadow-sm">OPENED</div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="p-6 bg-[#FFFBEB] border border-[#FEF3C7] rounded-[24px] flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-amber-100 shadow-sm">
               <Rocket className="w-5 h-5 text-amber-600 stroke-[2px]" />
            </div>
            <div className="flex-1">
               <h4 className="text-xs font-bold text-[#92400E] uppercase tracking-widest mb-1">Final Confirmation</h4>
               <p className="text-[11px] text-[#B45309] leading-relaxed opacity-90">Once launched, this competition will go live for all students. Registration systems and automated bracket tracking will be initialized.</p>
            </div>
         </div>
      </div>
   );
}