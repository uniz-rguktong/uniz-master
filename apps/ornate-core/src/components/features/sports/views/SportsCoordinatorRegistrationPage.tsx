'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Users,
    User,
    Plus,
    ChevronRight,
    Trophy,
    Filter,
    ArrowRight,
    CheckCircle2,
    Calendar,
    MapPin,
    Users2,
    ChevronDown,
    Zap
} from 'lucide-react';
import { getSports, type FormattedSport } from '@/actions/sportGetters';
import { useToast } from '@/hooks/useToast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function SportsCoordinatorRegistrationPage() {
    const [sports, setSports] = useState<FormattedSport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const { showToast } = useToast();

    useEffect(() => {
        async function loadSports() {
            setIsLoading(true);
            const res = await getSports();
            if (res.success && res.sports) {
                setSports(res.sports);
            } else {
                showToast(res.error || 'Failed to fetch sports', 'error');
            }
            setIsLoading(false);
        }
        loadSports();
    }, [showToast]);

    const filteredSports = sports.filter(sport => {
        const matchesSearch = sport.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || sport.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = Array.from(new Set(sports.map(s => s.category).filter(Boolean))) as string[];

    return (
        <div className="p-4 md:p-8 animate-page-entrance">
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
                    <span>Dashboard</span>
                    <span>›</span>
                    <span className="text-[#1A1A1A] font-medium">Registrations</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Sports Registration</h1>
                        <p className="text-[#7A7772] text-sm max-w-xl font-medium">
                            Select a sport to register students for individual or team events.
                            Available for all categories including Boys and Girls.
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-[#F8F7F4] rounded-[32px] p-2 mb-10 border border-[#E5E7EB]/50 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="bg-white rounded-[26px] p-3 md:p-4 shadow-sm relative z-10 border border-white">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group/search">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] group-focus-within/search:text-orange-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search sports (e.g. Cricket, Badminton...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-sm font-semibold placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/50 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger className="w-full md:w-[220px] h-[52px] bg-[#F9FAFB] border-[#E5E7EB] rounded-2xl px-5 text-xs font-bold uppercase tracking-widest text-[#1A1A1A] hover:bg-white transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-3.5 h-3.5 text-orange-500" />
                                        <SelectValue placeholder="All Categories" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-[#E5E7EB] shadow-xl p-1">
                                    <SelectItem value="all" className="rounded-xl text-xs font-bold uppercase tracking-widest py-3">All Categories</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat} className="rounded-xl text-xs font-bold uppercase tracking-widest py-3">
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-[24px] border border-[#E5E7EB] p-6 h-[200px] animate-pulse">
                            <div className="h-4 w-24 bg-gray-100 rounded mb-4" />
                            <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
                            <div className="flex gap-2 mb-4">
                                <div className="h-4 w-16 bg-gray-100 rounded" />
                                <div className="h-4 w-16 bg-gray-100 rounded" />
                            </div>
                        </div>
                    ))
                ) : filteredSports.length > 0 ? (
                    filteredSports.map((sport, idx) => (
                        <div
                            key={sport.id}
                            className="group bg-white rounded-[32px] border border-[#E5E7EB] p-2 overflow-hidden hover:border-orange-500/30 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 animate-card-entrance relative cursor-default"
                            style={{ animationDelay: `${idx * 40}ms` }}
                        >
                            <div className="p-4 md:p-6 bg-[#F9FAFB]/50 rounded-[26px] group-hover:bg-white transition-colors duration-500">
                                <div className="flex items-start justify-between mb-5">
                                    <div className="flex flex-col gap-1">
                                        <span className="px-3 py-1 bg-orange-100/50 text-orange-600 text-[9px] font-bold uppercase tracking-[0.15em] rounded-lg border border-orange-200/50 w-fit">
                                            {sport.category || 'SPORT'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-white shadow-sm border border-gray-100 px-3 py-1.5 rounded-xl">
                                        <Users2 className="w-3 h-3 text-orange-400" />
                                        {sport.type || 'N/A'}
                                    </div>
                                </div>

                                <h3 className="text-xl md:text-2xl font-bold text-[#1A1A1A] mb-5 group-hover:text-orange-600 transition-colors leading-tight tracking-tight">
                                    {sport.name}
                                </h3>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-3 bg-white rounded-2xl border border-gray-100 group-hover:border-orange-100 transition-colors">
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                            <Calendar className="w-3 h-3" />
                                            Scheduled
                                        </div>
                                        <span className="text-xs font-bold text-[#1A1A1A]">{sport.date}</span>
                                    </div>
                                    <div className="p-3 bg-white rounded-2xl border border-gray-100 group-hover:border-orange-100 transition-colors">
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                            <MapPin className="w-3 h-3" />
                                            Location
                                        </div>
                                        <span className="text-xs font-bold text-[#1A1A1A] truncate block">{sport.venue}</span>
                                    </div>
                                </div>

                                <Link
                                    href={`/sports/registrations/${sport.id}`}
                                    className="flex items-center justify-between w-full p-4.5 bg-[#1A1A1A] hover:bg-orange-600 active:scale-[0.98] rounded-2xl transition-all duration-300 shadow-xl shadow-black/5"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mb-0.5">Registration</span>
                                        <span className="text-sm font-bold text-white tracking-wide">Enter Squad Details</span>
                                    </div>
                                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md group-hover:rotate-90 transition-transform">
                                        <ArrowRight className="w-5 h-5 text-white" />
                                    </div>
                                </Link>
                            </div>

                            {/* Decorative element */}
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors" />
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                            <Trophy className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">No sports found</h3>
                        <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

