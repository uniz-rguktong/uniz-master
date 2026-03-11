import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export const FeatureCard = ({
    icon,
    title,
    description,
    index,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    index: number;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.8 }}
        whileHover={{ y: -5 }}
        className="group p-8 bg-white border border-slate-100 rounded-[2rem] hover:shadow-2xl hover:border-blue-900/10 transition-all duration-500 ease-out flex flex-col h-full"
    >
        <div className="w-14 h-14 bg-slate-50 flex items-center justify-center rounded-2xl text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-colors duration-500">
            {icon}
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-accent transition-colors">
            {title}
        </h3>
        <p className="text-slate-500 font-medium leading-relaxed mb-10 flex-grow">
            {description}
        </p>
        <div className="pt-6 border-t border-slate-50 mt-auto">
            <button className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-accent group-hover:gap-3 transition-all">
                Learn More <ArrowRight size={14} />
            </button>
        </div>
    </motion.div>
);
