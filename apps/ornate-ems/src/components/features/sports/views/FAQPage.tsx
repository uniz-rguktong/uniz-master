'use client';
import { useState, useEffect } from 'react';
import {
    Plus,
    Minus,
    Search,
    HelpCircle,
    ChevronRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function FAQPage() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("Common Questions");
    const [expandedIndex, setExpandedIndex] = useState(0);


    const categories = ["Common Questions", "Tournament Rules", "Team Management", "Technical"];

    const faqs = [
        {
            question: "How do I create a new tournament?",
            answer: "To create a new tournament, navigate to the Dashboard and click on 'Add Sport/Tournament'. Defines categories (Men/Women), rules, and fixture settings in a simple guided process.",
            category: "Common Questions"
        },
        {
            question: "Can I manually adjust fixtures?",
            answer: "Yes. While the system auto-generates fixtures, you can drag-and-drop teams in the 'Polls & Fixtures' module to adjust seedings or match-ups before publishing.",
            category: "Tournament Rules"
        },
        {
            question: "How are team registrations verified?",
            answer: "Go to the 'Registrations' tab. You'll see a list of pending teams. check their player details and eligibility proofs, then click 'Approve' to confirm their entry.",
            category: "Team Management"
        },
        {
            question: "What happens if a match is drawn?",
            answer: "For knockout stages, you can input penalty shoot-out scores or extra time results directly in the 'Match Results' section to determine a winner.",
            category: "Tournament Rules"
        },
        {
            question: "How do I update live scores?",
            answer: "Select the match from the 'Live Matches' dashboard and use the scoring interface to update points. Changes are reflected instantly on the student portal and leaderboard.",
            category: "Common Questions"
        },
        {
            question: "Can I export match results?",
            answer: "Yes, navigate to 'Results & Awards' and use the 'Export Data' feature to download comprehensive match reports and point tables in Excel or PDF format.",
            category: "Technical"
        },
        {
            question: "Is there a limit on team size?",
            answer: "You define the team size limits (min/max players) when creating the tournament. The system automatically enforces these rules during team registration.",
            category: "Team Management"
        },
        {
            question: "How do I generate certificates?",
            answer: "Go to the 'Results & Awards' section, select the winning teams, and click 'Generate Certificates'. The system creates localized PDFs for all team members.",
            category: "Common Questions"
        },
        {
            question: "Can I disqualify a team?",
            answer: "Yes, authorized admins can disqualify a team for rule violations from the 'Team Management' or 'Live Match' control panels. This action is logged for audit purposes.",
            category: "Team Management"
        },
        {
            question: "What if the scoreboard isn't syncing?",
            answer: "Check your internet connection first. If the issue persists, try refreshing the page. Persistent sync errors should be reported to technical support immediately.",
            category: "Technical"
        }
    ];

    const filteredFaqs = faqs.filter(faq =>
        (activeTab === "Common Questions" || faq.category === activeTab) &&
        (faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-4 md:p-8 animate-page-entrance">
            {/* Header */}
            <div className="mb-0">
                <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
                    <span>Support</span>
                    <span className="text-[#9CA3AF]">›</span>
                    <span className="text-[#1A1A1A] font-medium">FAQs</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex-1">
                        <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">Frequently Asked Questions</h1>
                        <p className="text-sm text-[#6B7280]">Find answers to common questions about managing sports events.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
                {/* Main Content Area */}
                <div className="lg:col-span-12">
                    <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] h-full">
                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-[12px] mt-[10px] mb-[16px]">
                            <div className="flex-1 relative w-full sm:max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                                <input
                                    type="text"
                                    placeholder="Search for answers..."
                                    className="pl-9 pr-4 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Categories Tab - Pill Style */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide w-full sm:w-auto justify-end">
                                <div className="flex items-center bg-[#F4F2F0] border border-[#E5E7EB] rounded-full p-1 shrink-0">
                                    {categories.map((cat: any) => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveTab(cat)}
                                            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === cat
                                                ? 'bg-white text-[#1A1A1A] shadow-sm'
                                                : 'text-[#6B7280] hover:text-[#1A1A1A]'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* FAQs List */}
                        <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-4 min-h-[500px]">
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5].map((i: any) => (
                                        <div key={i} className="rounded-xl border border-transparent p-6 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Skeleton width="70%" height={24} />
                                                <Skeleton width={32} height={32} borderRadius="50%" />
                                            </div>
                                            <Skeleton width="40%" height={16} />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredFaqs.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredFaqs.map((faq: any, idx: any) => (
                                        <div
                                            key={idx}
                                            className={`rounded-xl border transition-all duration-300 overflow-hidden ${expandedIndex === idx ? 'bg-[#F9FAFB] border-[#E5E7EB]' : 'bg-white border-transparent hover:bg-[#F9FAFB]'
                                                }`}
                                        >
                                            <button
                                                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                                                className="w-full px-6 py-5 flex items-center justify-between text-left group"
                                            >
                                                <span className={`text-base font-bold transition-colors ${expandedIndex === idx ? 'text-[#1A1A1A]' : 'text-[#4B5563] group-hover:text-[#1A1A1A]'}`}>
                                                    {faq.question}
                                                </span>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${expandedIndex === idx ? 'bg-[#1A1A1A] text-white rotate-180' : 'bg-[#F3F4F6] text-[#6B7280] group-hover:bg-[#E5E7EB]'
                                                    }`}>
                                                    {expandedIndex === idx ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                </div>
                                            </button>
                                            <div
                                                className={`px-6 transition-all duration-300 ease-in-out ${expandedIndex === idx ? 'max-h-[500px] pb-6 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                                                    }`}
                                            >
                                                <p className="text-[#6B7280] text-sm leading-relaxed">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-[#F9FAFB] rounded-xl border border-dashed border-[#E5E7EB]">
                                    <HelpCircle className="w-10 h-10 text-[#D1D5DB] mb-3" />
                                    <h3 className="text-sm font-bold text-[#1A1A1A] mb-1">No matching questions</h3>
                                    <p className="text-xs text-[#6B7280]">Try searching with different keywords</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
}
