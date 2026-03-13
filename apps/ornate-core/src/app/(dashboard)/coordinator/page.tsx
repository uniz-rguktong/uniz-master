import { getCoordinatorEvents } from '@/actions/coordinatorGetters';
import Link from 'next/link';
import { Calendar, MapPin, UserCheck, PlusCircle, Users, ChevronRight, IndianRupee } from 'lucide-react';
import { getCategoryColor } from '@/lib/constants';
import { WelcomeToast } from '@/components/dashboard/WelcomeToast';

export const dynamic = 'force-dynamic';

export default async function CoordinatorDashboard() {
    const { success, events, error } = await getCoordinatorEvents();

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="p-4 bg-red-50 rounded-full mb-4">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h2 className="text-xl font-bold text-[#1A1A1A]">Access Error</h2>
                <p className="text-[#6B7280] mt-2">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <WelcomeToast title="Coordinator Dashboard" />
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
                        <span>Dashboard</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-[#1A1A1A] font-medium">My Events</span>
                    </div>
                    <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] mb-1">My Events</h1>
                    <p className="text-sm text-[#6B7280]">Manage attendance and registrations for assigned events</p>
                </div>
            </div>

            {!events || events.length === 0 ? (
                <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                    <div className="bg-white rounded-[14px] p-12 text-center border border-dashed border-[#E5E7EB]">
                        <div className="w-16 h-16 bg-[#F7F8FA] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#E5E7EB]">
                            <Calendar className="w-8 h-8 text-[#D1D5DB]" />
                        </div>
                        <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">No Events Assigned</h3>
                        <p className="text-sm text-[#6B7280] max-w-sm mx-auto">
                            You haven&apos;t been assigned to coordinate any events yet. Contact your Branch Admin.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event: any) => {
                        const totalReg = event.totalRegistrations || 0;
                        const capacity = event.capacity || 0;
                        const registrationFill = capacity > 0 ? Math.min(100, Math.round((totalReg / capacity) * 100)) : 0;
                        const feeLabel = event.fee && event.fee !== '0' ? event.fee : 'Free';
                        const dateLabel = new Intl.DateTimeFormat('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        }).format(new Date(event.date)).replace(/\//g, ' / ');
                        const timeLabel = new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                        const categoryLabel = event.category
                            ? String(event.category)
                            : (event.eventType ? String(event.eventType).replace(/_/g, ' ') : 'General');
                        const categoryColor = getCategoryColor(categoryLabel);
                        const posterFallback = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop';

                        return (
                            <div key={event.id} className="group animate-card-entrance">
                                <div className="w-full bg-[#F4F2F0] rounded-[18px] p-[10px] flex flex-col gap-3 transition-shadow duration-200 hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)]">
                                    <div className="flex items-start justify-between gap-3 px-[12px] py-[4px] mt-[4px]">
                                        <h3 className="text-[16px] font-semibold text-[#1A1A1A] leading-6">
                                            {event.title}
                                        </h3>
                                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
                                            {event.sourceDashboard || 'Branch Admin Dashboard'}
                                        </span>
                                    </div>

                                    <div className="bg-white rounded-[14px] p-[10px] flex flex-col gap-4">
                                        <div className="relative w-full aspect-16/10 rounded-[12px] overflow-hidden group/thumbnail bg-[#F7F8FA]">
                                            <img
                                                src={event.posterUrl || posterFallback}
                                                alt={event.title}
                                                className="w-full h-full object-cover rounded-[12px] transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div
                                                className="absolute top-3 left-3 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg backdrop-blur-sm"
                                                style={{ backgroundColor: categoryColor }}
                                            >
                                                {categoryLabel}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-[#6B7280]">
                                                    <Users className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-medium">{totalReg}/{capacity || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[#6B7280]">
                                                    <IndianRupee className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-medium">{feeLabel}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 px-1">
                                            <div className="flex items-start gap-2.5">
                                                <MapPin className="w-3.5 h-3.5 text-[#9CA3AF] mt-0.5 shrink-0" />
                                                <span className="text-[13px] text-[#6B7280] leading-tight">{event.venue || 'TBD'}</span>
                                            </div>
                                            <div className="flex items-start gap-2.5">
                                                <Calendar className="w-3.5 h-3.5 text-[#9CA3AF] mt-0.5 shrink-0" />
                                                <span className="text-[13px] text-[#6B7280] leading-tight">{dateLabel} • {timeLabel}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 px-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF]">Registration Fill</span>
                                                <span className="text-[10px] font-black text-[#1A1A1A]">{registrationFill}%</span>
                                            </div>
                                            <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000"
                                                    style={{
                                                        width: `${registrationFill}%`,
                                                        backgroundColor: categoryColor
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2 border-t border-[#E8EAED]">
                                            <Link
                                                href={`/coordinator/event/${event.id}/attendance`}
                                                className="flex-1 h-9 bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB] transition-all flex items-center justify-center gap-2 active:scale-95 group/btn"
                                            >
                                                <UserCheck className="w-4 h-4 text-[#374151] group-hover/btn:scale-110 transition-transform" />
                                                <span className="text-xs font-semibold text-[#374151]">Live Attendance</span>
                                            </Link>
                                            <Link
                                                href={`/coordinator/event/${event.id}/spot-registration`}
                                                className="flex-1 h-9 bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB] transition-all flex items-center justify-center gap-2 active:scale-95 group/btn"
                                            >
                                                <PlusCircle className="w-4 h-4 text-[#374151] group-hover/btn:scale-110 transition-transform" />
                                                <span className="text-xs font-semibold text-[#374151]">Spot Registration</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
