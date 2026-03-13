'use client';

import type { Registration, ColumnDefinition, RegistrationsTableConfig } from '../types';
import { Search, RefreshCw } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface RegistrationsFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    filterEvent: string;
    setFilterEvent: (eventId: string) => void;
    events: { id: string; title: string }[];
    eventTypes?: string[];
    onReset: () => void;
    placeholder?: string;
}

export function RegistrationsFilters({
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterEvent,
    setFilterEvent,
    events,
    eventTypes,
    onReset,
    placeholder = "Search by name, roll number, registration ID, or event..."
}: RegistrationsFiltersProps) {
    return (
        <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] mb-6">
            <div className="bg-white rounded-[14px] p-5">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                        <input
                            type="text"
                            placeholder={placeholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
                            {/* Filter controls */}
                            <div className="flex-1 sm:min-w-[140px]">
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-full h-[42px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A]">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="all" className="">All Status</SelectItem>
                                        <SelectItem value="confirmed" className="">Confirmed</SelectItem>
                                        <SelectItem value="pending" className="">Pending</SelectItem>
                                        <SelectItem value="pending-payment" className="">Pending Payment</SelectItem>
                                        <SelectItem value="pending-requirements" className="">Pending Requirements</SelectItem>
                                        <SelectItem value="waitlist" className="">Waitlist</SelectItem>
                                        <SelectItem value="rejected" className="">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1 sm:min-w-[140px]">
                                <Select value={filterEvent} onValueChange={setFilterEvent}>
                                    <SelectTrigger className="w-full h-[42px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#1A1A1A]">
                                        <SelectValue placeholder="All Events" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="all" className="">All Events</SelectItem>
                                        {events.map((event: any) => (
                                            <SelectItem key={event.id} value={event.id} className="">
                                                {event.title}
                                            </SelectItem>
                                        ))}
                                        {eventTypes?.map((type: any) => (
                                            <SelectItem key={type} value={type} className="">
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <button
                            onClick={onReset}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-[#F7F8FA] transition-colors whitespace-nowrap mt-1 sm:mt-0"
                        >
                            <RefreshCw className="w-4 h-4 shrink-0" />
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
