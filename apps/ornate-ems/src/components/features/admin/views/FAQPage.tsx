'use client';
import { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Search,
  HelpCircle,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Zap,
  ShieldCheck,
  LifeBuoy
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function FAQPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Common Questions");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-12 animate-page-entrance">
      {/* Dynamic Header */}
      <div className="max-w-5xl mx-auto mb-16 space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-indigo-200">
            <LifeBuoy className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Support Core <ChevronRight className="w-3 h-3" /> Knowledge Base
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">Archive</span></h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm space-y-3">
            <Zap className="w-5 h-5 text-amber-500" />
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Quick Start</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Deploy your first event in under 3 minutes.</p>
          </div>
          <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm space-y-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Security First</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">End-to-end encryption for all registration data.</p>
          </div>
          <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm space-y-3">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Direct Support</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Our agents are available for manual assistance.</p>
          </div>
        </div>
      </div>

      {/* Interface Core */}
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-[48px] border border-gray-100 shadow-2xl overflow-hidden shadow-gray-200/50">
          {/* Navigation Bar */}
          <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-50/50">
            <div className="relative w-full md:w-[320px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search manual codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === cat ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Content Engine */}
          <div className="p-10 min-h-[500px]">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 bg-gray-50 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : filteredFaqs.length > 0 ? (
              <div className="space-y-4">
                {filteredFaqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className={`rounded-[32px] border transition-all duration-500 overflow-hidden ${expandedIndex === idx ? 'bg-indigo-50/30 border-indigo-100/50 shadow-inner' : 'bg-white border-gray-50 hover:border-gray-200'}`}
                  >
                    <button
                      onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                      className="w-full px-8 py-7 flex items-center justify-between text-left group"
                    >
                      <span className={`text-base font-black tracking-tight leading-tight transition-all ${expandedIndex === idx ? 'text-indigo-900 scale-105 origin-left' : 'text-gray-900 group-hover:translate-x-1'}`}>
                        {faq.question}
                      </span>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${expandedIndex === idx ? 'bg-indigo-600 text-white shadow-xl rotate-180' : 'bg-gray-50 text-gray-300'}`}>
                        {expandedIndex === idx ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      </div>
                    </button>
                    <div className={`transition-all duration-500 ease-in-out px-8 ${expandedIndex === idx ? 'max-h-[500px] pb-8 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                      <div className="h-px w-full bg-indigo-100/50 mb-6" />
                      <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-3xl">
                        {faq.answer}
                      </p>
                      <div className="mt-6 flex items-center gap-2">
                        <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-indigo-50">Verified Logic</div>
                        <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{faq.category}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-gray-300 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100 border-spacing-4">
                <Sparkles className="w-12 h-12 mb-6 opacity-10" />
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Zero Matches Found</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-2">Adjust your query parameters for broader scope.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-8 p-10 bg-indigo-600 rounded-[48px] relative overflow-hidden shadow-2xl shadow-indigo-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Still have questions?</h2>
            <p className="text-sm text-indigo-100 font-medium opacity-80">Our specialized support agents are ready for direct uplink.</p>
          </div>
          <button className="relative z-10 px-10 py-5 bg-white text-indigo-600 rounded-[28px] text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:-translate-y-1 transition-all">Submit Support Ticket</button>
        </div>
      </div>
    </div>
  );
}
