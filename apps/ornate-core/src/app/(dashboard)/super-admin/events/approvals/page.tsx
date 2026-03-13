import { Check, X, Eye, Clock, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { getPendingApprovals } from '@/actions/superAdminGetters';

export default async function EventApprovalsPage() {
    const pendingEvents = await getPendingApprovals();

    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A]">Event Approvals</h1>
                        <p className="text-sm text-[#6B7280]">Review and authorize event proposals from branches and clubs.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {pendingEvents.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Check className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                        <p className="text-gray-500">No pending approvals at the moment.</p>
                    </div>
                ) : (
                    pendingEvents.map((event: any) => (
                        <div key={event.id} className="bg-white rounded-[18px] border border-[#E5E7EB] overflow-hidden shadow-sm flex flex-col md:flex-row">
                            {/* Poster / Visual */}
                            <div className="w-full md:w-48 h-48 relative bg-gray-100 shrink-0">
                                <Image
                                    src={event.poster}
                                    alt={event.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider">
                                                {event.organizer}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                Submitted {event.submittedAt}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-[#1A1A1A]">{event.name}</h3>
                                        <p className="text-xs text-indigo-600 font-medium">{event.branch} Portal</p>
                                    </div>
                                    <button className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
                                        <Eye className="w-4 h-4" />
                                        Preview
                                    </button>
                                </div>

                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                                {/* Conflict Warning */}
                                {event.conflicts && event.conflicts.length > 0 && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-bold text-red-700">Conflict Detected</h4>
                                            <ul className="text-xs text-red-600 mt-1 list-disc list-inside">
                                                {event.conflicts.map((c: any, i: any) => (
                                                    <li key={i}>{c.message}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="mt-auto flex gap-3 pt-4 border-t border-gray-100">
                                    <button className="flex-1 bg-[#1A1A1A] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#2D2D2D] transition-colors flex items-center justify-center gap-2">
                                        <Check className="w-4 h-4" />
                                        Approve Event
                                    </button>
                                    <button className="flex-1 bg-white border border-[#E5E7EB] text-red-600 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center gap-2">
                                        <X className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
