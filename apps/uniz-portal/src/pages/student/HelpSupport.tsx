import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";

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
      "Yes! You can install uniZ as a PWA by clicking 'Install App' in your browser menu on Android or 'Add to Home Screen' on iOS.",
  },
];

const HelpSupport = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div>
      <PageHeader
        title="Help and support"
        meta="Everything you need to know about the uniZ student portal."
      />
      <div className="divide-y divide-border border-y border-border">
        {faqs.map((faq, index) => {
          const open = openFaq === index;
          return (
            <div key={faq.question}>
              <button
                type="button"
                onClick={() => setOpenFaq(open ? null : index)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
                aria-expanded={open}
              >
                <span className="text-body font-medium text-head">{faq.question}</span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-text-2 transition-transform duration-150", open && "rotate-180")}
                  aria-hidden
                />
              </button>
              {open ? (
                <p className="pb-4 text-dense leading-5 text-text-2">{faq.answer}</p>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-6">
        <Panel title="Contact us">
          <dl className="divide-y divide-border">
            <div className="pb-4">
              <dt className="text-dense text-text-2">Contact for support</dt>
              <dd className="mt-1">
                <a
                  href="mailto:webadmin@rguktong.ac.in"
                  className="text-body font-medium text-head underline-offset-[1px] hover:underline"
                >
                  webadmin@rguktong.ac.in
                </a>
              </dd>
            </div>
            <div className="pt-4">
              <dt className="text-dense text-text-2">Meet the developers</dt>
              <dd className="mt-1">
                <Link
                  to="/developers"
                  className="text-body font-medium text-head underline-offset-[1px] hover:underline"
                >
                  View developers page →
                </Link>
              </dd>
            </div>
          </dl>
        </Panel>
      </div>
    </div>
  );
};

export default HelpSupport;
