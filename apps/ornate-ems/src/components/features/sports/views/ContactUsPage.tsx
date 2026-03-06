'use client';
import { useState, useEffect } from 'react';
import {
    Mail,
    Phone,
    MapPin,
    Send,
    ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

export function ContactUsPage() {
    const { toast, showToast, hideToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subject, setSubject] = useState("");

    const handleSubmit = (e: any) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setIsSubmitting(false);
        showToast("Message sent successfully! Our team will contact you soon.", "success");
        setSubject(""); // Reset form
        e.target.reset();
    };

    return (
        <div className="p-4 md:p-8 animate-page-entrance">

            {/* Header */}
            <div className="mb-0">
                <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
                    <span>Support</span>
                    <span className="text-[#9CA3AF]">›</span>
                    <span className="text-[#1A1A1A] font-medium">Contact Us</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex-1">
                        <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">Get in Touch</h1>
                        <p className="text-sm text-[#6B7280]">We&apos;re here to help you with any questions about tournaments or technical support.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Contact Form Section */}
                <div className="lg:col-span-8">
                    <div className="bg-[#F4F2F0] rounded-[18px] pt-2 pr-2 pb-6 pl-2 h-full">
                        {/* Header Bar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-[12px] mt-[10px] mb-[16px]">
                            <div className="flex items-center gap-4">
                                <div className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider   text-[#7A7772] ">
                                    Send us a message
                                </div>
                                <p className="text-sm text-[#6B7280] hidden md:block">We&apos;ll get back to you shortly</p>
                            </div>
                        </div>

                        {/* White Inner Card */}
                        <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-8 h-[calc(100%-60px)]">
                            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                                {isLoading ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Skeleton width={80} height={14} />
                                                <Skeleton width="100%" height={42} borderRadius={12} />
                                            </div>
                                            <div className="space-y-2">
                                                <Skeleton width={80} height={14} />
                                                <Skeleton width="100%" height={42} borderRadius={12} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton width={80} height={14} />
                                            <Skeleton width="100%" height={42} borderRadius={12} />
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton width={80} height={14} />
                                            <Skeleton width="100%" height={150} borderRadius={12} />
                                        </div>
                                        <Skeleton width={140} height={48} borderRadius={12} />
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-[#1A1A1A]">Full Name</label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="Ex: Dr. Rajesh Kumar"
                                                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-[#1A1A1A]">Official Email</label>
                                                <input
                                                    required
                                                    type="email"
                                                    placeholder="Ex: rajesh.k@college.edu"
                                                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-[#1A1A1A]">Subject</label>
                                            <Select value={subject} onValueChange={setSubject}>
                                                <SelectTrigger className="w-full h-[42px] rounded-xl border-[#E5E7EB] bg-white focus:ring-[#10B981]">
                                                    <SelectValue placeholder="Select a topic..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="tournament_support">Tournament Support</SelectItem>
                                                    <SelectItem value="facility_booking">Facility Booking</SelectItem>
                                                    <SelectItem value="equipment_request">Equipment Request</SelectItem>
                                                    <SelectItem value="general">General Inquiry</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-[#1A1A1A]">Your Message</label>
                                            <textarea
                                                required
                                                rows={6}
                                                placeholder="Tell us more about how we can help..."
                                                className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all resize-none"
                                            ></textarea>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="px-8 py-3 bg-[#10B981] text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#059669] active:scale-95 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        Send Message
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>
                    </div>
                </div>

                {/* Sidebar / Info Section */}
                <div className="lg:col-span-4 space-y-6">
                    {isLoading ? (
                        <div className="bg-[#F4F2F0] rounded-[18px] pt-2 pr-2 pb-6 pl-2">
                            <div className="bg-white rounded-[14px] p-6 space-y-6">
                                <Skeleton width="100%" height={80} borderRadius={12} />
                                <Skeleton width="100%" height={80} borderRadius={12} />
                                <Skeleton width="100%" height={80} borderRadius={12} />
                            </div>
                        </div>
                    ) : (
                        [
                            { icon: Mail, label: "Email Administration", value: "sports.admin@college.edu", sub: "Response time: ~2 hours", color: "text-[#3B82F6]", bg: "bg-blue-50" },
                            { icon: Phone, label: "Emergency Support", value: "+91 98765 43210", sub: "Mon-Sat, 9am - 6pm", color: "text-[#10B981]", bg: "bg-emerald-50" },
                            { icon: MapPin, label: "Office Location", value: "Indoor Sports Complex", sub: "Room 101, Ground Floor", color: "text-[#F59E0B]", bg: "bg-amber-50" }
                        ].map((item: any, i: any) => (
                            <div key={i} className="bg-[#F4F2F0] rounded-[18px] pt-2 pr-2 pb-6 pl-2 flex flex-col transition-all hover:scale-[1.02] duration-300">
                                <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-6 shadow-sm flex items-start gap-4 flex-1">
                                    <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center shrink-0 border border-gray-100 shadow-sm`}>
                                        <item.icon className={`w-6 h-6 ${item.color}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-[#7A7772] uppercase tracking-widest opacity-70 mb-1">{item.label}</h3>
                                        <p className="text-sm font-bold text-[#1A1A1A]">{item.value}</p>
                                        <p className="text-[10px] text-[#6B7280] mt-0.5">{item.sub}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
}
