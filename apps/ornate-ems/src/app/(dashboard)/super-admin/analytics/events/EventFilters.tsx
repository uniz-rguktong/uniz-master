'use client';

import { useMemo, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const BRANCH_OPTIONS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];
const CLUB_OPTIONS = ['TechExcel', 'Sarvasrijana', 'Artix', 'Kaladharini', 'KhelSaathi', 'ICRO', 'Pixelro'];

export function EventFilters() {
    const [filterType, setFilterType] = useState<'Branches' | 'Clubs' | 'HHO'>('Branches');
    const [selectedValue, setSelectedValue] = useState<string>('CSE');

    const options = useMemo(() => {
        if (filterType === 'Branches') return BRANCH_OPTIONS;
        if (filterType === 'Clubs') return CLUB_OPTIONS;
        return ['HHO'];
    }, [filterType]);

    const handleTypeChange = (value: 'Branches' | 'Clubs' | 'HHO') => {
        setFilterType(value);
        if (value === 'Branches') {
            setSelectedValue('CSE');
            return;
        }
        if (value === 'Clubs') {
            setSelectedValue('TechExcel');
            return;
        }
        setSelectedValue('HHO');
    };

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Select value={filterType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full sm:w-[220px] bg-white border border-[#E5E7EB] text-[#1A1A1A] h-[40px]">
                    <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Branches">Branches</SelectItem>
                    <SelectItem value="Clubs">Clubs</SelectItem>
                    <SelectItem value="HHO">HHO</SelectItem>
                </SelectContent>
            </Select>

            {filterType !== 'HHO' && (
                <Select value={selectedValue} onValueChange={setSelectedValue}>
                    <SelectTrigger className="w-full sm:w-[220px] bg-white border border-[#E5E7EB] text-[#1A1A1A] h-[40px]">
                        <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((option) => (
                            <SelectItem key={option} value={option}>
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}
