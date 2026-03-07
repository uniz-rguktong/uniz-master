"use client";
import { useState, useEffect } from "react";
import { Plus, Minus, Search, HelpCircle, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function FAQPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1300);
    return () => clearTimeout(timer);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Common Questions");
  const [expandedIndex, setExpandedIndex] = useState(0);

  const categories = [
    "Common Questions",
    "Volunteering",
    "Donations",
    "Events",
  ];

  const faqs = [
    {
      question: "How do I add a new volunteer manually?",
      answer:
        "Navigate to the 'Volunteers' section in the sidebar. Click on the 'Add Volunteer' button. You'll need to enter their basic details including name, student ID, and contact information.",
      category: "Volunteering",
    },
    {
      question: "How can I track donation history?",
      answer:
        "Go to the 'Donations' tab. You can filter donations by date, donor name, or campaign. You can also export the donation report as a CSV file for auditing.",
      category: "Donations",
    },
    {
      question: "How do I create a new charity drive?",
      answer:
        "Click on 'Create Event' from the dashboard. Select 'Charity Drive' as the event type. Fill in the details about the cause, target amount (if any), and volunteer requirements.",
      category: "Events",
    },
    {
      question: "Can I assign roles to volunteers?",
      answer:
        "Yes, within the 'Volunteers' management page, you can assign roles such as 'Team Lead', 'Field Volunteer', or 'Logistics Coordinator'. This helps in better event management.",
      category: "Volunteering",
    },
    {
      question: "How do I verify a donation receipt?",
      answer:
        "In the 'Pending Donations' section, you can view uploaded screenshots of payment receipts. Verify the transaction ID with your bank statement and click 'Approve'.",
      category: "Donations",
    },
    {
      question: "Who can access the HHO admin dashboard?",
      answer:
        "Only authorized student coordinators and faculty supervisors have access. You can manage access levels in the 'Settings' page under 'Team Management'.",
      category: "Common Questions",
    },
    {
      question: "How to specific volunteer hours for a student?",
      answer:
        "Go to the student's profile in the 'Volunteers' list. You can manually log hours for specific events or approve hours claimed by the volunteer.",
      category: "Volunteering",
    },
    {
      question: "Is there a limit to the number of events we can host?",
      answer:
        "There is no strict limit, but all events must be approved by the faculty advisor. Ensure you do not overlap with major university examinations or other major events.",
      category: "Common Questions",
    },
    {
      question: "How do I generate a certificate for volunteers?",
      answer:
        "After an event is marked as 'Completed', go to the event details. There is a 'Generate Certificates' option which will create bulk certificates for all attendees marked as 'Present'.",
      category: "Events",
    },
    {
      question: "How to handle cash donations?",
      answer:
        "Cash donations must be immediately deposited to the official HHO bank account. The receipt must be uploaded to the portal with the 'Cash Deposit' tag for transparency.",
      category: "Donations",
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      (activeTab === "Common Questions" || faq.category === activeTab) &&
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
          <span className="text-[#1A1A1A] font-medium">FAQs</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">
              Frequently Asked <span className="text-[#F59E0B]">Questions</span>
            </h1>
            <p className="text-sm text-[#6B7280]">
              Find answers to common questions about managing HHO operations.
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
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                        activeTab === cat
                          ? "bg-white text-[#1A1A1A] shadow-sm"
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
                      className="rounded-xl border border-transparent p-6 space-y-2"
                    >
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
