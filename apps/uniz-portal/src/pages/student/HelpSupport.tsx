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
      "Yes! You can install UniZ as a PWA by clicking 'Install App' in your browser menu on Android or 'Add to Home Screen' on iOS.",
  },
];

const HelpSupport = () => {
  const [activeTab, setActiveTab] = useState<"faq" | "contact">("faq");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto pb-20 px-2 lg:px-0">
      <div className="flex flex-col items-start mb-8 text-left">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2 font-display">
          Help & Support
        </h1>
        <p className="text-zinc-500 font-medium tracking-tight max-w-sm">
          Everything you need to know about the UniZ student portal.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-start mb-8 p-1.5 bg-zinc-100/50 backdrop-blur-sm rounded-2xl w-fit border border-zinc-200/50">
        <button
          onClick={() => setActiveTab("faq")}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
            activeTab === "faq"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-400 hover:text-zinc-600",
          )}
        >
          FAQS
        </button>
        <button
          onClick={() => setActiveTab("contact")}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
            activeTab === "contact"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-400 hover:text-zinc-600",
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
                  <span className="font-bold text-zinc-900 tracking-tight text-[13px]">
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
                  <div className="px-5 pb-5 text-[13px] text-zinc-600 font-medium leading-relaxed border-t border-zinc-100 pt-4">
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
              className="flex items-center gap-4 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold tracking-[0.12em] text-zinc-400 uppercase mb-1">
                  Contact for support
                </p>
                <p className="text-[15px] font-bold text-zinc-900 group-hover:text-zinc-700 truncate">
                  webadmin@rguktong.ac.in
                </p>
              </div>
            </a>

            <Link
              to="/developers"
              className="flex items-center gap-4 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-zinc-200 transition-colors">
                <Users className="w-5 h-5 text-zinc-900" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold tracking-[0.12em] text-zinc-400 uppercase mb-1">
                  Meet the developers
                </p>
                <p className="text-[15px] font-bold text-zinc-900 group-hover:text-zinc-700 underline underline-offset-4">
                  View developers page
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
