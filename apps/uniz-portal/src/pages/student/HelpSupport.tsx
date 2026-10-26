import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail, Users } from "lucide-react";
import { cn } from "../../utils/cn";

const faqs = [
  {
    question: "How do I check my semester results?",
    answer:
      "Tap the grid icon in the bottom dock and choose Results. All your subject grades and SGPA/CGPA will be listed there.",
  },
  {
    question: "How can I update my profile details?",
    answer:
      "Go to the 'Home' section. If you see an 'Edit' button, you can click it to update your phone number and email. For critical details like ID number, please contact the administration.",
  },
  {
    question: "What should I do if my attendance is incorrect?",
    answer:
      "Open Attendance from the bottom dock menu, or file a grievance under Grievance with the category 'Attendance'. Our academic team will review your records.",
  },
  {
    question: "How do I register for semester subjects?",
    answer:
      "Tap Register in the bottom dock to open semester subject registration when the window is open.",
  },
  {
    question: "How do I reset my portal password?",
    answer:
      "Tap the grid icon in the bottom dock and choose Security to change your password. Use a strong password with at least 8 characters.",
  },
  {
    question: "Is the student portal available as an app?",
    answer:
      "Yes! Click 'Download Android App' to install the signed uniZ.apk on Android, or click 'Download iOS App' to install the iOS app profile on iPhone and iPad.",
  },
];

const HelpSupport = () => {
  const [activeTab, setActiveTab] = useState<"faq" | "contact">("faq");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto pb-20 px-2 lg:px-0">
      <div className="flex flex-col items-start mb-8 text-left">
        <h1 className="text-3xl font-bold text-navy-900 mb-2 font-display">
          Help & Support
        </h1>
        <p className="text-navy-500 font-medium tracking-tight max-w-sm">
          Everything you need to know about the UniZ student portal.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-start mb-8 p-1.5 bg-navy-100/50 rounded-[2px] w-fit border border-navy-200/50">
        <button
          onClick={() => setActiveTab("faq")}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300",
            activeTab === "faq"
              ? "bg-white text-navy-900 shadow-sm"
              : "text-navy-400 hover:text-navy-600",
          )}
        >
          FAQs
        </button>
        <button
          onClick={() => setActiveTab("contact")}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300",
            activeTab === "contact"
              ? "bg-white text-navy-900 shadow-sm"
              : "text-navy-400 hover:text-navy-600",
          )}
        >
          Contact us
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
                className="bg-white border border-[#0A2540] rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-bold text-navy-900 tracking-tight text-[13px]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-[#061B33] transition-transform duration-300",
                      openFaq === index && "rotate-180",
                    )}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === index ? "auto" : 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-[13px] text-navy-600 font-medium leading-relaxed border-t border-navy-100 pt-4">
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
            className="space-y-4"
          >
            <a
              href="mailto:webadmin@rguktong.ac.in"
              className="flex items-center gap-4 bg-white border border-navy-200 rounded-[2px] p-6 shadow-sm hover:border-navy-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-[2px] bg-navy-900 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-navy-500 mb-0.5">
                  Contact for support
                </p>
                <p className="text-[15px] font-semibold text-navy-900 group-hover:text-navy-700 truncate">
                  webadmin@rguktong.ac.in
                </p>
              </div>
            </a>

            <Link
              to="/developers"
              className="flex items-center gap-4 bg-white border border-navy-200 rounded-[2px] p-6 shadow-sm hover:border-navy-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-[2px] bg-navy-100 flex items-center justify-center shrink-0 group-hover:bg-navy-200 transition-colors">
                <Users className="w-5 h-5 text-navy-900" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-navy-500 mb-0.5">
                  Meet the developers
                </p>
                <p className="text-[15px] font-semibold text-navy-900 group-hover:text-navy-700">
                  View developers page →
                </p>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpSupport;
