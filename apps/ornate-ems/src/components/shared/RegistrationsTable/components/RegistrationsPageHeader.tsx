'use client';

import { Mail, Download, Plus } from 'lucide-react';

interface RegistrationsPageHeaderProps {
    title: string;
    description: string;
    onSendEmail: () => void;
    onExport: () => void;
    onAddRegistration?: (() => void) | undefined;
    breadcrumbs: { label: string; active?: boolean }[];
    exportLabel?: string;
    showSendEmail?: boolean;
    showExport?: boolean;
}

export function RegistrationsPageHeader({
    title,
    description,
    onSendEmail,
    onExport,
    onAddRegistration,
    breadcrumbs,
    exportLabel = "Export Data",
    showSendEmail = true,
    showExport = true
}: RegistrationsPageHeaderProps) {
    return (
        <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280] mb-3">
                {breadcrumbs.map((crumb: any, idx: any) => (
                    <span key={crumb.label} className="flex items-center gap-2">
                        <span className={crumb.active ? "text-[#1A1A1A] font-medium whitespace-nowrap" : "whitespace-nowrap"}>
                            {crumb.label}
                        </span>
                        {idx < breadcrumbs.length - 1 && <span className="whitespace-nowrap">›</span>}
                    </span>
                ))}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">{title}</h1>
                    <p className="text-sm text-[#6B7280]">{description}</p>
                </div>

                <div className="hidden md:flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    {onAddRegistration && (
                        <button
                            onClick={onAddRegistration}
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Add Registration
                        </button>
                    )}
                    {showSendEmail && (
                        <button
                            onClick={onSendEmail}
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors w-full sm:w-auto"
                        >
                            <Mail className="w-4 h-4" />
                            Send Email
                        </button>
                    )}
                    {showExport && (
                        <button
                            onClick={onExport}
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors w-full sm:w-auto"
                        >
                            <Download className="w-4 h-4" />
                            {exportLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
