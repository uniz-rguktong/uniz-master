'use client';
import { useState, useEffect } from 'react';
import {
    Search,
    HelpCircle,
    ChevronRight,
    ShieldCheck,
    Zap,
    Users,
    Layout,
    BarChart3,
    Database,
    Globe
} from 'lucide-react';
import { Modal } from '@/components/Modal'; // Assuming generic Modal component exists or I need to import from somewhere else. 
// Note: clb-views/DocumentationPage imported Modal from '../components/Modal'. 
// I should check where Modal is. src/clb-views/../components/Modal -> src/clb-components/Modal? Or src/components/Modal?
// Let's assume src/components/Modal exists based on typical structure, or I might need to correct the import.
// Checking file listing earlier... src/components/SidebarSuperAdmin.jsx exists. 
// I'll check if src/components/Modal.jsx exists.

import { Skeleton } from '@/components/ui/skeleton'; // Assuming this exists or using the one from clb-components if generic.

export default function DocumentationPage() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);


    const categories = [
        { id: "all", name: "All Topics" },
        { id: "system", name: "System Management" },
        { id: "users", name: "User & Roles" },
        { id: "data", name: "Data & Reports" }
    ];

    const docs = [
        // --- System Management ---
        {
            id: 1,
            title: "Global Dashboard Overview",
            description: "Understanding system-wide telemetry, health metrics, and global alerts.",
            category: "System Management",
            readTime: "2 min",
            icon: Layout,
            content: (
                <div className="space-y-4 text-sm text-[#4B5563]">
                    <p>The Super Admin Dashboard provides a bird's-eye view of the entire platform. Key metrics include:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>System Health:</strong> CPU, Memory, and Storage usage stats of the hosting server.</li>
                        <li><strong>Active Users:</strong> Real-time count of currently logged-in users across all portals.</li>
                        <li><strong>Global Alerts:</strong> Critical notifications regarding system errors or security breaches.</li>
                    </ul>
                </div>
            ),
            questions: [
                "How often is system telemetry updated?",
                "What do red status indicators mean?",
                "Can I customize the dashboard widgets?"
            ]
        },
        {
            id: 2,
            title: "Club & Entity Management",
            description: "Provisioning new clubs, managing existing entities, and archiving inactive ones.",
            category: "System Management",
            readTime: "4 min",
            icon: Zap,
            content: (
                <div className="space-y-4 text-sm text-[#4B5563]">
                    <p>Super Admins have full control over the organizational structure:</p>
                    <ul className="list-disc pl-5 space-y-3">
                        <li><strong>Onboarding:</strong> Create new club entities with default admins and resources.</li>
                        <li><strong>Configuration:</strong> Set storage quotas and feature flags for specific clubs.</li>
                        <li><strong>Lifecycle:</strong> Suspend or archive clubs that are no longer active.</li>
                    </ul>
                </div>
            ),
            questions: [
                "How to create a new club?",
                "What happens to data when a club is archived?",
                "Can I merge two entities?"
            ]
        },

        // --- User & Roles ---
        {
            id: 3,
            title: "User Administration",
            description: "Managing student accounts, faculty staff, and external vendors.",
            category: "User & Roles",
            readTime: "5 min",
            icon: Users,
            content: (
                <div className="space-y-4 text-sm text-[#4B5563]">
                    <p>Centralized user management allows you to:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Bulk Import:</strong> Onboard batch of students via CSV upload.</li>
                        <li><strong>Profile Editing:</strong> Update critical user information and reset credentials.</li>
                        <li><strong>Access Control:</strong> Lock accounts or force password resets for security.</li>
                    </ul>
                </div>
            ),
            questions: [
                "How to reset a student password?",
                "Can I bulk delete users?",
                "How to handle duplicate accounts?"
            ]
        },
        {
            id: 4,
            title: "RBAC & Permissions",
            description: "Configuring Role-Based Access Control policies and custom roles.",
            category: "User & Roles",
            readTime: "6 min",
            icon: ShieldCheck,
            content: (
                <div className="space-y-4 text-sm text-[#4B5563]">
                    <p>Define what users can see and do:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Role Definitions:</strong> Create granular roles with specific capabilities (e.g., 'Finance Viewer').</li>
                        <li><strong>Permission Matrix:</strong> visual editor for assigning API endpoints to roles.</li>
                        <li><strong>Inheritance:</strong> Understanding how permissions cascade from global to local scope.</li>
                    </ul>
                </div>
            ),
            questions: [
                "How to create a custom role?",
                "What is the 'Super User' permission?",
                "Can I view effective permissions for a user?"
            ]
        },

        // --- Data & Reports ---
        {
            id: 5,
            title: "Global Reporting",
            description: "Generating comprehensive reports across all clubs and events.",
            category: "Data & Reports",
            readTime: "4 min",
            icon: BarChart3,
            content: (
                <div className="space-y-4 text-sm text-[#4B5563]">
                    <p>Access data from the entire organization:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Financial Reports:</strong> Aggregate revenue and transaction summaries.</li>
                        <li><strong>Participation Stats:</strong> Analyze engagement trends across different departments.</li>
                        <li><strong>Custom Query Builder:</strong> Create specific datasets for ad-hoc analysis.</li>
                    </ul>
                </div>
            ),
            questions: [
                "Can I schedule automated email reports?",
                "How to export data to external BI tools?",
                "Is PII data masked in reports?"
            ]
        },
        {
            id: 6,
            title: "Backup & Recovery",
            description: "Managing database snapshots and restoration procedures.",
            category: "Data & Reports",
            readTime: "3 min",
            icon: Database,
            content: (
                <div className="space-y-4 text-sm text-[#4B5563]">
                    <p>Ensure business continuity:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Snapshot Schedule:</strong> Configure frequency of automated backups.</li>
                        <li><strong>Point-in-Time Recovery:</strong> Restore the database to a specific second.</li>
                        <li><strong>Disaster Recovery Drills:</strong> Simulating data loss scenarios.</li>
                    </ul>
                </div>
            ),
            questions: [
                "How frequently are backups taken?",
                "Where are backups stored?",
                "How long does a full restore take?"
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
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
                    <span>Support</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#1A1A1A] font-medium">Documentation</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">System Documentation</h1>
                        <p className="text-sm text-[#6B7280]">Technical guides and references for Super Administrators.</p>
                    </div>
                </div>
            </div>

            {/* Main Content Wrapper */}
            <div className="bg-[#F8F9FA] rounded-[24px] p-2 md:p-3 border border-[#E5E7EB]">

                {/* Modern Toolbar */}
                <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-4 mb-2">
                    {/* Search Section */}
                    <div className="relative w-full xl:max-w-md group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-[#9CA3AF] group-focus-within:text-[#3B82F6] transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-2xl text-[15px] placeholder-[#9CA3AF] focus:outline-none focus:ring-4 focus:ring-[#3B82F6]/10 focus:border-[#3B82F6] transition-all shadow-sm"
                            placeholder="Search documentation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Categories Section */}
                    <div className="w-full xl:w-auto overflow-hidden">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide px-1">
                            <div className="flex items-center bg-white border border-[#E5E7EB] rounded-[20px] p-1.5 shadow-sm min-w-max">
                                {categories.map((cat: any) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`px-6 py-2.5 rounded-[16px] text-[13px] font-bold uppercase tracking-wider transition-all duration-300 ${activeCategory === cat.id
                                            ? 'bg-[#1A1A1A] text-white shadow-lg'
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

                {/* Content Grid */}
                <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-4 md:p-8 min-h-[600px] shadow-sm">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i: any) => (
                                <div key={i} className="border border-[#F3F4F6] rounded-[16px] p-6 bg-[#FAFAFA]/50 animate-pulse">
                                    <div className="h-10 w-10 bg-gray-200 rounded-xl mb-4"></div>
                                    <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 w-full bg-gray-200 rounded mb-1"></div>
                                    <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : filteredDocs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDocs.map((doc: any, idx: any) => (
                                <div
                                    key={doc.id}
                                    onClick={() => { setSelectedDoc(doc); setShowModal(true); }}
                                    className="group border border-[#F3F4F6] rounded-[16px] p-6 hover:shadow-lg hover:border-[#E5E7EB] transition-all duration-300 cursor-pointer bg-[#FAFAFA]/50 hover:bg-white animate-card-entrance flex flex-col h-full"
                                    style={{ animationDelay: `${idx * 40}ms` }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                                            <doc.icon className="w-5 h-5 text-[#1A1A1A]" />
                                        </div>
                                        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F3F4F6] px-2 py-1 rounded">
                                            {doc.readTime} read
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-[#1A1A1A] mb-2 leading-tight group-hover:text-[#3B82F6] transition-colors">
                                        {doc.title}
                                    </h3>
                                    <p className="text-sm text-[#6B7280] leading-relaxed mb-6 line-clamp-3">
                                        {doc.description}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-gray-100/50 px-2 py-0.5 rounded">
                                            {doc.category}
                                        </span>
                                        <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center group-hover:bg-[#1A1A1A] transition-colors">
                                            <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:text-white" />
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
                footer={
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowModal(false)}
                            className="px-6 py-2.5 rounded-[12px] text-[15px] font-medium text-white transition-all shadow-md active:scale-95 bg-[#1A1A1A] hover:bg-[#374151]"
                        >
                            Close Guide
                        </button>
                    </div>
                }
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
