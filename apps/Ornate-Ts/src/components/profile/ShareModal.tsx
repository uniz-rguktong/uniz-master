'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Twitter, Linkedin, MessageCircle, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareUrl: string;
    title: string;
}

export default function ShareModal({ isOpen, onClose, shareUrl, title }: ShareModalProps) {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOptions = [
        {
            name: 'WhatsApp',
            icon: <MessageCircle className="w-5 h-5" />,
            color: '#25D366',
            href: `https://wa.me/?text=${encodeURIComponent(`${title}: ${shareUrl}`)}`,
        },
        {
            name: 'X (Twitter)',
            icon: <Twitter className="w-5 h-5" />,
            color: '#000000',
            href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
        },
        {
            name: 'LinkedIn',
            icon: <Linkedin className="w-5 h-5" />,
            color: '#0077B5',
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-sm bg-[#0a0a0f] border border-[#D6FF00]/20 p-6 overflow-hidden"
                        style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
                    >
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-12 h-[1px] bg-[#D6FF00]/30" />
                        <div className="absolute top-0 right-0 w-[1px] h-12 bg-[#D6FF00]/30" />
                        
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black tracking-[0.3em] uppercase text-[#D6FF00]">Share Profile</h3>
                            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Social Links */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            {shareOptions.map((option) => (
                                <a
                                    key={option.name}
                                    href={option.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center gap-2 group"
                                >
                                    <div 
                                        className="w-12 h-12 flex items-center justify-center border transition-all duration-300 group-hover:scale-110 group-active:scale-95"
                                        style={{ 
                                            borderColor: `${option.color}40`, 
                                            backgroundColor: `${option.color}08`, 
                                            color: option.color,
                                            boxShadow: `0 0 0px ${option.color}00`,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = `0 0 15px ${option.color}40`;
                                            e.currentTarget.style.borderColor = option.color;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = `0 0 0px ${option.color}00`;
                                            e.currentTarget.style.borderColor = `${option.color}40`;
                                        }}
                                    >
                                        {option.icon}
                                    </div>
                                    <span className="text-[9px] font-black text-white/40 tracking-[0.2em] uppercase group-hover:text-white transition-colors text-center">
                                        {option.name === 'X (Twitter)' ? 'X' : option.name}
                                    </span>
                                </a>
                            ))}
                        </div>

                        {/* Copy Link Section */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black tracking-[0.3em] uppercase text-white/40">Link</label>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={shareUrl}
                                    className="bg-transparent border-none outline-none text-white/60 text-xs w-full font-mono truncate"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="shrink-0 p-2 bg-[#D6FF00]/10 border border-[#D6FF00]/30 text-[#D6FF00] hover:bg-[#D6FF00]/20 transition-all"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D6FF00]/30 to-transparent opacity-50" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
