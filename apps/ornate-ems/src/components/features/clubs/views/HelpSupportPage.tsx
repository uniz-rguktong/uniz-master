'use client';

import { useState } from 'react';
import {
    Search,
    HelpCircle,
    MessageSquare,
    Send,
    FileText,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Activity,
    Clock
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { submitSupportTicket } from '@/actions/supportActions';
import { DocumentationPage } from './DocumentationPage';

export function HelpSupportPage() {
    const [activeTab, setActiveTab] = useState('docs');
    const [ticketForm, setTicketForm] = useState<any>({
        subject: '',
        category: 'Technical Issue',
        priority: 'medium',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const handleTicketSubmit = async (e: any) => {
        e.preventDefault();
        if (!ticketForm.subject || !ticketForm.message) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('subject', ticketForm.subject);
            formData.append('category', ticketForm.category);
            formData.append('priority', ticketForm.priority);
            formData.append('message', ticketForm.message);

            const result = await submitSupportTicket(formData);

            if (result.success) {
                showToast('Support ticket submitted successfully', 'success');
                setTicketForm({
                    subject: '',
                    category: 'Technical Issue',
                    priority: 'medium',
                    message: ''
                });
                setActiveTab('status'); // Switch to status tab to show success/mock status
            } else {
                showToast(result.error || 'Failed to submit ticket', 'error');
            }
        } catch (error) {
            console.error('Ticket submission error:', error);
            showToast('An unexpected error occurred', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const tabs = [
        { id: 'docs', label: 'Knowledge Base', icon: FileText },
        { id: 'contact', label: 'Contact Support', icon: MessageSquare },
        { id: 'status', label: 'System Status', icon: Activity },
    ];

    return (
        <div className="p-4 md:p-8 animate-page-entrance">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
                    <span>Resources</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#1A1A1A] font-medium">Help & Support</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Help Center</h1>
                        <p className="text-sm text-[#6B7280]">Find answers, contact support, and check system status.</p>
                    </div>
                </div>
            </div>

            {/* Main Content Wrapper */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-[#F4F2F0] rounded-[18px] p-2 flex flex-col gap-2 sticky top-6">
                        {tabs.map((tab: any) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                            ? 'bg-white text-[#1A1A1A] shadow-sm border border-[#E5E7EB]'
                                            : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white/50'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#3B82F6]' : ''}`} />
                                    {tab.label}
                                </button>
                            );
                        })}

                        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">Need urgent help?</h4>
                            <p className="text-xs text-blue-600 mb-3">
                                For critical system outages, please contact the IT administration directly.
                            </p>
                            <a href="mailto:support@ornate-ems.com" className="text-xs font-bold text-blue-700 hover:underline">
                                support@ornate-ems.com
                            </a>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9">
                    {activeTab === 'docs' && (
                        <div className="bg-white rounded-[20px] border border-[#E5E7EB] shadow-sm overflow-hidden">
                            {/* Reusing DocumentationPage Component directly for modularity */}
                            <DocumentationPage />
                        </div>
                    )}

                    {activeTab === 'contact' && (
                        <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 md:p-8 shadow-sm">
                            <div className="max-w-2xl mx-auto">
                                <div className="text-center mb-8">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="w-6 h-6 text-[#3B82F6]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Submit a Support Ticket</h2>
                                    <p className="text-sm text-[#6B7280]">
                                        Describe your issue below. Our support team typically responds within 24 hours.
                                    </p>
                                </div>

                                <form onSubmit={handleTicketSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#1A1A1A]">Subject</label>
                                        <input
                                            type="text"
                                            value={ticketForm.subject}
                                            onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                                            placeholder="Brief summary of the issue"
                                            className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-[#1A1A1A]">Category</label>
                                            <select
                                                value={ticketForm.category}
                                                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                                            >
                                                <option>Technical Issue</option>
                                                <option>Account Access</option>
                                                <option>Feature Request</option>
                                                <option>Billing / Finance</option>
                                                <option>Other</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-[#1A1A1A]">Priority</label>
                                            <select
                                                value={ticketForm.priority}
                                                onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
                                            >
                                                <option value="low">Low - General Inquiry</option>
                                                <option value="medium">Medium - Standard Issue</option>
                                                <option value="high">High - Urgent / Blocker</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#1A1A1A]">Message</label>
                                        <textarea
                                            rows={6}
                                            value={ticketForm.message}
                                            onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                                            placeholder="Please provide detailed information about your request..."
                                            className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all resize-none"
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-semibold hover:bg-black transition-all shadow-lg active:scale-[0.98] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Submit Ticket
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'status' && (
                        <div className="space-y-6">
                            {/* Overall Status Card */}
                            <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#1A1A1A]">All Systems Operational</h3>
                                        <p className="text-sm text-[#6B7280]">Last checked: Just now</p>
                                    </div>
                                </div>
                                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Live</span>
                                </div>
                            </div>

                            {/* Service Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { name: 'Authentication Service', status: 'Operational', uptime: '99.9%' },
                                    { name: 'Database (PostgreSQL)', status: 'Operational', uptime: '99.9%' },
                                    { name: 'File Storage (R2/Base64)', status: 'Operational', uptime: '100%' },
                                    { name: 'Email Gateway', status: 'Operational', uptime: '98.5%' },
                                ].map((service: any, idx: any) => (
                                    <div key={idx} className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm hover:border-[#3B82F6] transition-colors group">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-semibold text-[#1A1A1A]">{service.name}</h4>
                                            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[#6B7280]">Status</span>
                                            <span className="font-medium text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded">{service.status}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                            <div className="bg-[#10B981] h-full rounded-full w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Incidents (Mock) */}
                            <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-sm">
                                <h3 className="text-base font-bold text-[#1A1A1A] mb-4">Recent Incident History</h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                                            <div className="w-0.5 h-full bg-gray-100" />
                                        </div>
                                        <div className="pb-4">
                                            <div className="text-sm font-semibold text-[#1A1A1A]">Maintenance Window</div>
                                            <div className="text-xs text-[#6B7280] mb-1">Feb 10, 2026 • 02:00 AM - 04:00 AM</div>
                                            <p className="text-sm text-[#4B5563]">Scheduled database optimization and security patching completed successfully.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-[#1A1A1A]">System Performance Normal</div>
                                            <div className="text-xs text-[#6B7280]">Feb 14, 2026 • Today</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
