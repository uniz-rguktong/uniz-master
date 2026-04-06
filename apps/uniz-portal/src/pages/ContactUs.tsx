import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { ArrowLeft, Copy, Check, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Contact {
  name: string;
  mobile: string;
}

const contacts: Contact[] = [
  { name: "D.Sree Charan", mobile: "6300625861" },
  { name: "V. Anand", mobile: "7416210829" },
  { name: "A. Bhanu Prakash", mobile: "8500292426" },
  { name: "D. SeethaRam Praveena", mobile: "9392820326" }
];

function ContactCard({ name, mobile }: Contact) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(mobile);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-slate-900 transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
    >
      <div className="flex flex-col items-start gap-1.5">
        <span className="text-slate-900 font-bold text-xl tracking-tight">{name}</span>
        <div className="flex items-center gap-2.5 text-slate-400 font-mono text-sm bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
          <Phone className="w-3.5 h-3.5 text-slate-300" />
          <span>{mobile}</span>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="relative p-4 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 active:scale-90"
        title="Copy number"
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Check className="w-5 h-5 text-emerald-400 group-hover:text-emerald-400" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Copy className="w-5 h-5 group-hover:rotate-6 transition-transform" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center py-24 px-6">
      <div className="max-w-xl w-full">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 shadow-sm rounded-full mb-8">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">Contact Channels</span>
          </div>
          <h1 className="text-7xl font-black text-slate-900 mb-6 uppercase tracking-tighter leading-none">
            Get in <span className="text-slate-300">Touch</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium max-w-md mx-auto leading-relaxed">
            Reach out to our coordinators for immediate assistance.
          </p>
        </motion.div>

        {/* Contacts List */}
        <div className="flex flex-col gap-5 mb-20">
          {contacts.map((contact, index) => (
            <motion.div
              key={contact.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ContactCard {...contact} />
            </motion.div>
          ))}
        </div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center gap-10"
        >
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <Link to="/">
            <Button
              variant="outline"
              className="h-16 px-12 rounded-full border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-900 transition-all duration-500 group"
            >
              <ArrowLeft className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold uppercase tracking-widest text-xs">Return to Home</span>
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
