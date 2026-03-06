'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
    Search,
    HelpCircle,
    FileText,
    ChevronRight,
    ShieldCheck,
    Zap,
    Users,
    Layout,
    Calendar,
    BarChart3,
    PieChart,
    Globe,
    Mail,
    Settings,
    Shield,
    List,
    Image,
    Video,
    Award,
    Download,
    Upload,
    UserPlus,
    QrCode,
    FileBadge,
    Bell,
    Home,
    Clock,
    TrendingUp,
    Megaphone,
    Trophy,
    FileJson,
    Heart
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Skeleton } from '@/components/ui/skeleton';

interface DocItem {
    id: number;
    title: string;
    description: string;
    category: string;
    readTime: string;
    icon: any;
    content: React.ReactNode;
    questions?: string[];
}

interface Category {
    id: string;
    name: string;
}

export function DocumentationPage() {
    const pathname = usePathname();
    const isSportsAdminRoute = pathname?.startsWith('/sports/');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
    const [showModal, setShowModal] = useState(false);


    const categories: Category[] = [
        { id: "all", name: "All Topics" },
        { id: "basics", name: "Platform Basics" },
        { id: "tournaments", name: "Tournament Engineering" },
        { id: "teams", name: "Student Teams" },
        { id: "results", name: "Scoring & Results" },
        { id: "branding", name: "Branding & Media" }
    ];

    const docs: DocItem[] = [
        // --- Platform Basics ---
        {
            id: 1,
            title: "Dashboard Ecosystem",
            description: "Understand the core layout and real-time telemetry displayed on your home screen.",
            category: "Platform Basics",
            readTime: "2 min",
            icon: Home,
            content: (
                <div className="space-y-4 text-sm text-[#4B5563]">
                    <p>The Dashboard Ecosystem is designed for high-velocity management. Key features include:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Live Telemetry:</strong> Real-time counts of ongoing tournaments, registered teams, and matches.</li>
                        <li><strong>Quick Actions:</strong> Shortcuts to create fixtures, schedule matches, or post updates.</li>
                        <li><strong>Flash Feed:</strong> A list of the most recent match results and team registrations.</li>
                    </ul>
                </div>
            ),
            questions: [
                "How often is the telemetry updated?",
                "Can I customize the charts displayed?",
                "Where does the 'Flash Feed' pull data from?"
            ]
        },

        // --- Tournament Engineering ---
        {
            id: 3,
            title: "Creating a Tournament",
            description: "From sport selection to fixture rules—how to launch a new tournament.",
            category: "Tournament Engineering",
            readTime: "5 min",
            icon: Trophy,
            content: (
                <div className="space-y-4 text-sm text-[#4B5563]">
                    <p>Follow these steps to launch a new tournament:</p>
                    <ul className="list-disc pl-5 space-y-3">
                        <li><strong>Phase 1: Metadata:</strong> Define the sport, category (Men/Women), and date.</li>
                        <li><strong>Phase 2: Rules:</strong> Set match duration, team size limits, and scoring rules.</li>
                        <li><strong>Phase 3: Fixtures:</strong> Configure bracket type (Knockout/League) and seeding.</li>
                        <li><strong>Phase 4: Publish:</strong> Open registrations for branch teams.</li>
                    </ul>
                </div>
            ),
            questions: [
                "Can I edit rules after publishing?",
                "What bracket types are supported?",
                "How do I manage team registrations?"
            ]
        },
        {
            id: 4,
            title: "Managing Fixtures",
            description: "Automated schedule generation and manual adjustments.",
            category: "Tournament Engineering",
            readTime: "4 min",
            icon: List,
            content: (
                <div className="space-y-4 text-sm text-[#4B5563]">
                    <p>Efficiently manage your tournament schedule:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Use the <strong>Polls & Fixtures</strong> module to randomize matches.</li>
                        <li>Manually drag-and-drop teams to adjust seedings if required.</li>
                        <li>Publish the final schedule to notify all team captains instantly.</li>
                    </ul>
                </div>
            ),
            questions: [
                "How does the randomization algorithm work?",
                "Can I lock specific matches?",
                "Do captains get notified of changes?"
            ]
        },

        // --- Student Teams ---
        {
            id: 6,
            title: "Team Registration Flow",
            description: "Managing branch-wise team entries and player verification.",
            category: "Student Teams",
            readTime: "3 min",
            icon: Users,
            content: (
                <div className="space-y-4 text-sm text-[#4B5563]">
                    <p>Streamline team intake:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Review:</strong> View all pending team registrations in the 'Registrations' tab.</li>
                        <li><strong>Verify:</strong> Check player eligibility (ID cards, medical clearance).</li>
                        <li><strong>Action:</strong> Approve or reject entries with a single click.</li>
                    </ul>
                </div>
            ),
            questions: [
                "Can I bulk approve teams?",
                "What happens to rejected applications?",
                "Is there a limit on team members?"
            ]
        },

        // --- Scoring & Results ---
        {
            id: 8,
            title: "Live Match Scoring",
            description: "Real-time score updates and result publishing.",
            category: "Scoring & Results",
            readTime: "2 min",
            icon: FileText,
            content: (
                <div className="space-y-4 text-sm text-[#4B5563]">
                    <p>Keep the leaderboard current:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Navigate to <strong>Tournament Management &gt; Match Results</strong>.</li>
                        <li>Select the live match from the schedule.</li>
                        <li>Enter scores and designate the winner to auto-advance them in the bracket.</li>
                    </ul>
                </div>
            ),
            questions: [
                "Can I update scores from a mobile device?",
                "What if a match is drawn?",
                "How do I correct an input error?"
            ]
        },
        {
            id: 9,
            title: "Certificate Generation",
            description: "Automated awarding of participation and merit certificates.",
            category: "Scoring & Results",
            readTime: "2 min",
            icon: Award,
            content: (
                <div className="space-y-4 text-sm text-[#4B5563]">
                    <p>Reward achievement instantly:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Go to <strong>Results & Awards &gt; Generate Certificates</strong>.</li>
                        <li>Select the tournament, position (Gold/Silver), and recipients.</li>
                        <li>Click 'Generate' to create and email secure PDF certificates.</li>
                    </ul>
                </div>
            ),
            questions: [
                "Can I customize the certificate template?",
                "Are certificates verifiable?",
                "Do all participants get certificates?"
            ]
        },

        // --- Branding & Media ---
        {
            id: 11,
            title: "Gallery & Highlights",
            description: "Curating event photos and videos for the portal.",
            category: "Branding & Media",
            readTime: "4 min",
            icon: Image,
            content: (
                <div className="space-y-4 text-sm text-[#4B5563]">
                    <p>Showcase the action:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Upload high-resolution event photos to the Gallery module.</li>
                        <li>Tag specific tournaments or teams for better organization.</li>
                        <li>These assets appear on the main student portal to build engagement.</li>
                    </ul>
                </div>
            ),
            questions: [
                "Is there a file size limit?",
                "Can I embed YouTube videos?",
                "Who can download these images?"
            ]
        }
    ];

    const filteredDocs = docs.filter(d => {
        const matchesCategory = activeCategory === 'all' || d.category === categories.find(c => c.id === activeCategory)?.name;
        const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="p-4 md:p-8 animate-page-entrance">
            {/* Header */}
            <div className="mb-0">
                <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
                    <span>Resources</span>
                    <span className="text-[#9CA3AF]">›</span>
                    <span className="text-[#1A1A1A] font-medium">Documentation</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex-1">
                        <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">Knowledge Hub</h1>
                        <p className="text-sm text-[#6B7280]">Comprehensive guides for sports management modules.</p>
                    </div>
                </div>
            </div>

            {/* Main Content Wrapper */}
            <div className="bg-[#F8F9FA] rounded-[32px] p-2 md:p-3 border border-[#E5E7EB] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32" />

                {/* Modern Toolbar */}
                <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-4 mb-2 relative z-10">
                    {/* Search Section */}
                    <div className="relative w-full xl:max-w-md group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-[#9CA3AF] group-focus-within/search:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-3.5 bg-white border border-[#E5E7EB] rounded-2xl text-[15px] font-medium placeholder-[#9CA3AF] focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all shadow-sm"
                            placeholder="Search across guides..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Categories Section */}
                    <div className="w-full xl:w-auto overflow-hidden">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide px-1">
                            <div className="flex items-center bg-white border border-[#E5E7EB] rounded-[22px] p-1.5 shadow-sm min-w-max">
                                {categories.map((cat: Category) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`px-6 py-2.5 rounded-[18px] text-[12px] font-bold uppercase tracking-wider transition-all duration-500 ${activeCategory === cat.id
                                            ? 'bg-[#1A1A1A] text-white shadow-xl shadow-black/10'
                                            : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-gray-50'
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid - Enhanced White Card Background */}
                <div className="bg-white rounded-[26px] border border-[#E5E7EB] p-4 md:p-8 min-h-[600px] shadow-sm relative z-10">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i: any) => (
                                <div key={i} className="border border-[#F3F4F6] rounded-[16px] p-6 bg-[#FAFAFA]/50">
                                    <div className="flex items-start justify-between mb-4">
                                        <Skeleton width={44} height={44} borderRadius={12} />
                                        <Skeleton width={60} height={18} />
                                    </div>
                                    <Skeleton width="90%" height={24} className="mb-2" />
                                    <Skeleton width="100%" height={16} className="mb-1" />
                                    <Skeleton width="100%" height={16} className="mb-1" />
                                    <Skeleton width="70%" height={16} className="mb-6" />
                                    <div className="flex items-center justify-between">
                                        <Skeleton width={60} height={12} />
                                        <Skeleton width={32} height={32} borderRadius="50%" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredDocs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDocs.map((doc: DocItem, idx: number) => (
                                <div
                                    key={doc.id}
                                    onClick={() => { setSelectedDoc(doc); setShowModal(true); }}
                                    className="group border border-[#F3F4F6] rounded-[24px] p-6 hover:shadow-2xl hover:border-blue-500/20 transition-all duration-500 cursor-pointer bg-[#FAFAFA]/50 hover:bg-white animate-card-entrance flex flex-col h-full relative overflow-hidden"
                                    style={{ animationDelay: `${idx * 40}ms` }}
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex items-start justify-between mb-5 relative z-10">
                                        <div className="p-3 bg-white border border-[#E5E7EB] rounded-2xl group-hover:scale-110 group-hover:border-blue-100 transition-all duration-500 shadow-sm">
                                            <doc.icon className="w-5 h-5 text-[#1A1A1A] group-hover:text-blue-500 transition-colors" />
                                        </div>
                                        <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100/50">
                                            {doc.readTime}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-[#1A1A1A] mb-3 leading-tight group-hover:text-blue-600 transition-colors relative z-10 tracking-tight">
                                        {doc.title}
                                    </h3>
                                    <p className="text-[13px] text-[#6B7280] font-medium leading-relaxed mb-8 line-clamp-3 relative z-10">
                                        {doc.description}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto relative z-10">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100/50 px-2.5 py-1 rounded-lg">
                                            {doc.category}
                                        </span>
                                        <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-[#1A1A1A] transition-all duration-500 border border-gray-100 group-hover:border-transparent ${isSportsAdminRoute ? '' : 'group-hover:rotate-45'}`}>
                                            <ChevronRight className="w-5 h-5 text-[#6B7280] group-hover:text-white" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-[#F7F8FA] rounded-full flex items-center justify-center mb-4 border border-[#E5E7EB]">
                                <HelpCircle className="w-8 h-8 text-[#D1D5DB]" />
                            </div>
                            <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">No guides found</h3>
                            <p className="text-sm text-[#6B7280]">Try adjusting your search or category filter.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Article Detail Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={selectedDoc?.title || "Guide Details"}
                tooltipText="Read full documentation guide"
                onConfirm={() => setShowModal(false)}
                confirmText="Close Guide"
                footer={isSportsAdminRoute ? (
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={() => setShowModal(false)}
                            className="px-6 py-2.5 rounded-[12px] text-[15px] font-medium text-white transition-all shadow-md active:scale-95 bg-[#1A1A1A] hover:bg-[#374151]"
                        >
                            Close Guide
                        </button>
                    </div>
                ) : undefined}
            >
                {selectedDoc && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <selectedDoc.icon className="w-6 h-6 text-[#1A1A1A]" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">{selectedDoc.category}</div>
                                <div className="text-sm font-medium text-[#1A1A1A]">{selectedDoc.readTime} read</div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-[#1A1A1A] mb-2 uppercase tracking-wide">Overview</h4>
                            <p className="text-sm text-[#4B5563] leading-relaxed">
                                {selectedDoc.description}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-[#1A1A1A] mb-2 uppercase tracking-wide">Guide Content</h4>
                            <div className="space-y-3 bg-white p-6 rounded-xl border border-gray-100 shadow-inner">
                                {selectedDoc.content}
                            </div>
                        </div>

                        {selectedDoc.questions && selectedDoc.questions.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-[#1A1A1A] mb-3 uppercase tracking-wide">Related Questions</h4>
                                <div className="space-y-2">
                                    {selectedDoc.questions.map((q: any, i: any) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors cursor-default">
                                            <HelpCircle className="w-4 h-4 text-[#3B82F6]" />
                                            <span className="text-sm text-[#4B5563] font-medium">{q}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
