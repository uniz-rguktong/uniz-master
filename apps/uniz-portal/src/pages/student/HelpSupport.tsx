import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle } from "lucide-react";
import { cn } from "../../utils/cn";

const faqs = [
  {
    question: "How do I check my semester results?",
    answer:
      "You can view your results by clicking on the 'Explore' button in the bottom dock and selecting 'Results'. All your subject grades and SGPA/CGPA will be listed there.",
  },
  {
    question: "How can I update my profile details?",
    answer:
      "Go to the 'Home' section. If you see an 'Edit' button, you can click it to update your phone number and email. For critical details like ID number, please contact the administration.",
  },
  {
    question: "What should I do if my attendance is incorrect?",
    answer:
      "Go to the 'Grievance' section (under Explore menu) and submit a request with the category 'Attendance'. Our academic team will review your records.",
  },
  {
    question: "How do I reset my portal password?",
    answer:
      "For security, you can change your password anytime through the 'Security' section in the bottom dock. Use a strong password with at least 8 characters.",
  },
  {
    question: "Is the student portal available as an app?",
    answer:
      "Yes! You can install UniZ as a PWA by clicking 'Install App' in your browser menu on Android or 'Add to Home Screen' on iOS.",
  },
];

const HelpSupport = () => {
  const [activeTab, setActiveTab] = useState<"faq" | "contact">("faq");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto pb-20 px-2 lg:px-0">
      <div className="flex flex-col items-start mb-8 text-left">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 font-display">
          Help & Support
        </h1>
        <p className="text-slate-500 font-medium tracking-tight max-w-sm">
          Everything you need to know about the UniZ student portal.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-start mb-8 p-1.5 bg-slate-100/50 backdrop-blur-sm rounded-2xl w-fit border border-slate-200/50">
        <button
          onClick={() => setActiveTab("faq")}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
            activeTab === "faq"
              ? "bg-white text-navy-900 shadow-sm"
              : "text-slate-400 hover:text-slate-600",
          )}
        >
          FAQS
        </button>
        <button
          onClick={() => setActiveTab("contact")}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
            activeTab === "contact"
              ? "bg-white text-navy-900 shadow-sm"
              : "text-slate-400 hover:text-slate-600",
          )}
        >
          CONTACT US
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "faq" ? (
          <motion.div
            key="faq"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-black rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-bold text-slate-900 tracking-tight text-[13px]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-black transition-transform duration-300",
                      openFaq === index && "rotate-180",
                    )}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === index ? "auto" : 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-[13px] text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-4">
                    {faq.answer}
                  </div>
                </motion.div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="contact"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/60 backdrop-blur-xl p-12 rounded-3xl border border-white/20 shadow-xl text-center"
          >
            <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
              <MessageCircle className="w-10 h-10 text-navy-900" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 font-display italic">
              Still develop the contact page.....
            </h2>
            <p className="text-slate-400 font-medium tracking-tight">
              We're building a seamless way for you to connect with support.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpSupport;
