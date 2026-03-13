import { Modal } from '@/components/Modal';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from 'react';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    categories: string[];
    venues: string[];
    initialFilters: FilterState;
}

export interface FilterState {
    categories: string[];
    startDate: string;
    endDate: string;
    venue: string;
}

export function FilterModal({ isOpen, onClose, onApply, categories, venues, initialFilters }: FilterModalProps) {
    const [tempFilters, setTempFilters] = useState<FilterState>(initialFilters);

    const handleApply = () => {
        onApply(tempFilters);
        onClose();
    };

    const handleClear = () => {
        const cleared = { categories: [], startDate: '', endDate: '', venue: '' };
        setTempFilters(cleared);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Filter Events"
            onConfirm={handleApply}
            confirmText="Apply Filters"
            footer={null}
            tooltipText="">

            <div className="space-y-6">
                {/* Categories */}
                <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-3">Categories</label>
                    <div className="grid grid-cols-2 gap-3">
                        {categories.filter((c: any) => c !== 'All').map((category: any) => (
                            <label key={category} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={tempFilters.categories.includes(category)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setTempFilters((prev) => ({ ...prev, categories: [...prev.categories, category] }));
                                        } else {
                                            setTempFilters((prev) => ({ ...prev, categories: prev.categories.filter((c: any) => c !== category) }));
                                        }
                                    }}
                                    className="w-4 h-4 text-[#10B981] border-[#E5E7EB] rounded focus:ring-[#10B981]" />

                                <span className="text-sm text-[#4B5563]">{category}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Start Date</label>
                        <input
                            type="date"
                            value={tempFilters.startDate}
                            onChange={(e) => setTempFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">End Date</label>
                        <input
                            type="date"
                            value={tempFilters.endDate}
                            onChange={(e) => setTempFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                            className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]" />

                    </div>
                </div>

                {/* Venue */}
                <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Venue</label>
                    <Select
                        value={tempFilters.venue}
                        onValueChange={(value: string) => setTempFilters((prev) => ({ ...prev, venue: value }))}>
                        <SelectTrigger className="w-full h-[38px] bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#10B981]">
                            <SelectValue placeholder="All Venues" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="All Venues" className="cursor-pointer">All Venues</SelectItem>
                            {venues.map((venue: any) =>
                                <SelectItem key={venue} value={venue} className="cursor-pointer">{venue}</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Clear Button */}
                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleClear}
                        className="text-sm text-[#6B7280] hover:text-[#1A1A1A] underline">
                        Clear all filters
                    </button>
                </div>
            </div>
        </Modal>
    );
}
