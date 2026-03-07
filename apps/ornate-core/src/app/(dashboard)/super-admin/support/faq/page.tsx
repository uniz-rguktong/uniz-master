"use client";
import { useState, useEffect } from "react";
import { Plus, Minus, Search, HelpCircle, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FAQPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("System Administration");
  const [expandedIndex, setExpandedIndex] = useState(0);

  const categories = [
    "System Administration",
    "User Management",
    "Security & Access",
    "Troubleshooting",
  ];

  const faqs = [
    // --- System Administration ---
    {
      question: "How do I add a new academic year to the system?",
      answer:
        "Go to 'Settings' > 'Global Configuration'. Under the 'Academic Years' tab, click 'Add New Period'. This will automatically rollover student year mappings if configured.",
      category: "System Administration",
    },
    {
      question: "Can I put the entire platform into Maintenance Mode?",
      answer:
        "Yes. In 'Settings' > 'System Health', there is a 'Maintenance Mode' toggle. Enabling this will show a maintenance page to all non-admin users. Use this during major updates.",
      category: "System Administration",
    },
    {
      question: "How do I increase the storage quota for a specific club?",
      answer:
        "Navigate to 'Club Management', select the entity, and edit their 'Resource Limits'. Increases are applied instantly.",
      category: "System Administration",
    },
    {
      question: "What is the Global Broadcast feature?",
      answer:
        "It allows Super Admins to send push notifications to EVERY user on the platform. Use sparingly for critical announcements only.",
      category: "System Administration",
    },

    // --- User Management ---
    {
      question: "How do I force a password reset for a user?",
      answer:
        "Find the user in 'User Administration'. In the actions menu, select 'Force Password Reset'. The user will be required to set a new password on next login.",
      category: "User Management",
    },
    {
      question: "Can I bulk import students from an Excel sheet?",
      answer:
        "Yes. Use the standard CSV template provided in the 'Import' section. Ensure the 'College ID' field is unique to avoid duplication errors.",
      category: "User Management",
    },
    {
      question: "How to merge duplicate student accounts?",
      answer:
        "Currently, account merging must be done via a database script request. Please raise a ticket with the 'Database Query' category in the Support page.",
      category: "User Management",
    },

    // --- Security & Access ---
    {
      question: "Who can access the Super Admin dashboard?",
      answer:
        "Only users with the 'ROOT_ADMIN' role. This role cannot be assigned casually and requires database-level provisioning.",
      category: "Security & Access",
    },
    {
      question: "Where can I see the audit logs for a specific deletion?",
      answer:
        "Go to 'Security' > 'Audit Logs'. Filter by 'Action Type: DELETE' and the date range. You will see who performed the action and when.",
      category: "Security & Access",
    },
    {
      question: "Is Two-Factor Authentication (2FA) mandatory?",
      answer:
        "It is mandatory for Super Admins by default. You can enforce it for Club Admins in the 'Security Policies' settings.",
      category: "Security & Access",
    },

    // --- Troubleshooting ---
    {
      question: "Thedashboard is loading slowly. What should I check?",
      answer:
        "Check the 'System Health' widget. High CPU usage or Database Latency might be the cause. If metrics are normal, check your local network connection.",
      category: "Troubleshooting",
    },
    {
      question: "Emails are not being delivered. Why?",
      answer:
        "Check the 'SMTP Status' in settings. If the quota is exceeded or credentials have expired, emails will fail. You can view the error log in 'Communication Logs'.",
      category: "Troubleshooting",
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      (activeTab === "System Administration" || faq.category === activeTab) &&
      (faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="p-4 md:p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Support</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#1A1A1A] font-medium">System FAQs</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
              System Knowledge Base
            </h1>
            <p className="text-sm text-[#6B7280]">
              Advanced troubleshooting and system administration guides.
            </p>
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
                  placeholder="Search admin guides..."
                  className="pl-9 pr-4 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Categories Tab - Pill Style */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide w-full sm:w-auto justify-end">
                <div className="flex items-center bg-white border border-[#E5E7EB] rounded-full p-1 shrink-0">
                  {categories.map((cat: any) => (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                        activeTab === cat
                          ? "bg-[#1A1A1A] text-white shadow-sm"
                          : "text-[#6B7280] hover:text-[#1A1A1A]"
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
                    <div
                      key={i}
                      className="rounded-xl border border-transparent p-6 space-y-2 animate-pulse"
                    >
                      <div className="flex justify-between items-center">
                        <div className="h-6 w-2/3 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-4 w-1/2 bg-gray-200 rounded mt-2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredFaqs.length > 0 ? (
                <div className="space-y-3">
                  {filteredFaqs.map((faq: any, idx: any) => (
                    <div
                      key={idx}
                      className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                        expandedIndex === idx
                          ? "bg-[#F9FAFB] border-[#E5E7EB]"
                          : "bg-white border-transparent hover:bg-[#F9FAFB]"
                      }`}
                    >
                      <button
                        onClick={() =>
                          setExpandedIndex(expandedIndex === idx ? null : idx)
                        }
                        className="w-full px-6 py-5 flex items-center justify-between text-left group"
                      >
                        <span
                          className={`text-base font-bold transition-colors ${expandedIndex === idx ? "text-[#1A1A1A]" : "text-[#4B5563] group-hover:text-[#1A1A1A]"}`}
                        >
                          {faq.question}
                        </span>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            expandedIndex === idx
                              ? "bg-[#1A1A1A] text-white rotate-180"
                              : "bg-[#F3F4F6] text-[#6B7280] group-hover:bg-[#E5E7EB]"
                          }`}
                        >
                          {expandedIndex === idx ? (
                            <Minus className="w-4 h-4" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </div>
                      </button>
                      <div
                        className={`px-6 transition-all duration-300 ease-in-out ${
                          expandedIndex === idx
                            ? "max-h-[500px] pb-6 opacity-100"
                            : "max-h-0 opacity-0 pointer-events-none"
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
                  <h3 className="text-sm font-bold text-[#1A1A1A] mb-1">
                    No matching questions
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Try searching with different keywords
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
