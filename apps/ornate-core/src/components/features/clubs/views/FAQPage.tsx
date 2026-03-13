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


  const categories = ["Common Questions", "Registration", "Payment", "Account Safety"];

  const faqs = [
    {
      question: "How do I create a new event?",
      answer: "To create a new event, navigate to the Dashboard and click on the 'Add Event' button in the top header. You'll be guided through a simple 3-step process to set your event details, themes, and registration criteria.",
      category: "Common Questions"
    },
    {
      question: "Can I export registration data to Excel?",
      answer: "Yes, you can export registration data at any time. Go to the 'All Registrations' page, and use the 'Export' button. You can choose to export the entire list or just a filtered selection in CSV or Excel format.",
      category: "Common Questions"
    },
    {
      question: "What payment methods are supported?",
      answer: "VisionixAI currently supports UPI, Credit/Debit Cards, and Net Banking. Our premium integration ensures that all transactions are processed securely with real-time status updates on your dashboard.",
      category: "Payment"
    },
    {
      question: "How secure is my data?",
      answer: "We take security extremely seriously. All data is encrypted at rest and in transit. We also provide detailed audit logs in the Access Control section so you can track every security action taken on your workspace.",
      category: "Account Safety"
    },
    {
      question: "How do I manage attendee attendance live?",
      answer: "Use our 'Live Attendance' feature located in the header. You can search for students or use the QR scanner to mark attendance instantly. The stats will update in real-time.",
      category: "Common Questions"
    },
    {
      question: "What is the timeline for event approval?",
      answer: "Once you publish an event, it typically goes through a quick automated validation. If manual review is required by your institution's administrators, it usually takes 2-4 business hours.",
      category: "Common Questions"
    },
    {
      question: "How do students register for an event?",
      answer: "Students can register via the unique event link generated when you publish. They will need to provide their college ID, basic details, and complete the payment (if any) by uploading a screenshot.",
      category: "Registration"
    },
    {
      question: "Can I limit the number of registrations?",
      answer: "Yes, you can set a 'Registration Limit' during event creation. Once the limit is reached, students will be automatically moved to a waitlist, which you can manage from the 'Waitlist Management' page.",
      category: "Registration"
    },
    {
      question: "How do I verify student registrations?",
      answer: "Navigate to 'Pending Approvals'. You can view the payment screenshots and student details. Simply click 'Approve' to confirm their seat or 'Reject' if details are incorrect.",
      category: "Registration"
    },
    {
      question: "Are there any transaction fees?",
      answer: "VisionixAI does not charge any additional transaction fees above the standard gateway charges. Your club receives 100% of the net amount processed through our platform.",
      category: "Payment"
    },

    {
      question: "Can I change my account password?",
      answer: "Yes, go to 'Admin Profile' and look for the 'Security' tab. You can update your password and also enable Two-Factor Authentication (2FA) for added security.",
      category: "Account Safety"
    },
    {
      question: "Who has access to my club's financial data?",
      answer: "Only 'Super Admins' have access to financial reports and payout settings. Coordinators can only see registration numbers and participant lists without sensitive financial details.",
      category: "Account Safety"
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    (activeTab === "Common Questions" || faq.category === activeTab) &&
    (faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <h1 className="text-xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Frequently Asked <span className="text-[#F59E0B]">Questions</span></h1>
            <p className="text-sm text-[#6B7280]">Find answers to common questions about managing your events and account.</p>
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

              {/* Categories Tab - Scrollable on mobile */}
              <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
                <div className="flex items-center bg-[#F4F2F0] border border-[#E5E7EB] rounded-full p-1 min-w-max sm:min-w-0">
                  {categories.map((cat: any) => (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={`px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === cat
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
