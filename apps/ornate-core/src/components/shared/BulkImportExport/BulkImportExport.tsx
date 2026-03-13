'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Upload,
    Download,
    FileSpreadsheet,
    AlertCircle,
    CheckCircle,
    X,
    RefreshCw,
    Info,
    Search
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/useToast';
import { Modal } from '@/components/Modal';
import {
    getImportHistory,
    getExportHistory,
    getAllRegistrations
} from '@/actions/registrationGetters';
import {
    bulkImportRegistrations,
    logExportAction
} from '@/actions/registrationActions';
import { exportRegistrationsToCSV } from '@/lib/exportUtils';
import { getEvents } from '@/actions/eventGetters';
import { ADMIN_CONFIG, CLUBS_CONFIG, SPORTS_CONFIG } from './configs';
import type {
    BulkImportExportVariant,
    ImportHistoryItem,
    ExportHistoryItem
} from './types';

const CONFIG_MAP = {
    admin: ADMIN_CONFIG,
    clubs: CLUBS_CONFIG,
    sports: SPORTS_CONFIG
};

interface BulkImportExportProps {
    variant: BulkImportExportVariant;
}

export default function BulkImportExport({ variant }: BulkImportExportProps) {
    const config = CONFIG_MAP[variant];
    const { showToast } = useToast();

    // Tabs
    const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');

    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    // Data States
    const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
    const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
    const [availableEvents, setAvailableEvents] = useState<{ id: string; title: string }[]>([]);

    // Import Logic States
    const [uploadedFile, setUploadedFile] = useState<any>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [validationStatus, setValidationStatus] = useState<'idle' | 'checking' | 'valid' | 'error'>('idle');
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [showValidationModal, setShowValidationModal] = useState(false);

    // Export Logic States
    const [dateRange, setDateRange] = useState('All Time');
    const [eventFilter, setEventFilter] = useState('All Events');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [fileFormat, setFileFormat] = useState('CSV (.csv)');
    const [isLoadingExport, setIsLoadingExport] = useState(false);
    const [historySearch, setHistorySearch] = useState('');

    useEffect(() => {
        setIsMounted(true);
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await getEvents();
            if (res.success && res.data) {
                setAvailableEvents(res.data.map(e => ({ id: e.id, title: e.title })));
            }
        } catch (err) {
            console.error('Failed to fetch events');
        }
    };

    const fetchImportHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getImportHistory();
            if (result.success && result.data) {
                setImportHistory(result.data);
            } else if (!result.success) {
                showToast(result.error || 'Failed to fetch history', 'error');
            }
        } catch (err) {
            showToast('Error loading history', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    const fetchExportHistory = useCallback(async () => {
        try {
            const result = await getExportHistory();
            if (result.success && result.data) {
                setExportHistory(result.data);
            }
        } catch (err) {
            console.error('Failed to fetch export history');
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'import') fetchImportHistory();
        else fetchExportHistory();
    }, [activeTab, fetchImportHistory, fetchExportHistory]);

    // CSV Parsing Helper
    const parseCSVLine = (text: string) => {
        const result = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') inQuote = !inQuote;
            else if (char === ',' && !inQuote) {
                result.push(cur.trim().replace(/^"|"$/g, ''));
                cur = '';
            } else cur += char;
        }
        result.push(cur.trim().replace(/^"|"$/g, ''));
        return result;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        setUploadedFile({
            name: file.name,
            size: (file.size / 1024).toFixed(2) + ' KB',
            type: file.type
        });

        setShowValidationModal(true);
        setValidationStatus('checking');
        setValidationErrors([]);

        const reader = new FileReader();
        reader.onload = (event: any) => {
            const text = event.target?.result as string;
            if (!text) return;

            const rows = text.split(/\r?\n/).filter(r => r.trim());
            if (rows.length === 0) {
                showToast('CSV file is empty', 'error');
                return;
            }

            const headers = parseCSVLine(rows[0]!);

            // Map data
            const dataRows = rows.slice(1).map(row => {
                const values = parseCSVLine(row);
                const obj: any = {};
                headers.forEach((h: any, i: any) => {
                    if (i < values.length) obj[h] = values[i];
                });
                return obj;
            });
            setParsedData(dataRows);

            // Validate
            const missingColumns = config.requiredColumns.filter(col =>
                !headers.some(h => h.toLowerCase() === col.toLowerCase())
            );

            if (missingColumns.length > 0) {
                setValidationStatus('error');
                setValidationErrors(missingColumns);
            } else {
                setValidationStatus('valid');
            }
        };

        reader.readAsText(file.slice(0, 50000)); // Read first chunk for validation
    };

    const handleImport = async () => {
        if (!parsedData.length) return;

        setImporting(true);
        setImportProgress(10);

        try {
            const result = await bulkImportRegistrations(parsedData, uploadedFile?.name || 'unknown_file');
            if (result.success) {
                setImportProgress(100);
                showToast(`Successfully imported ${result.successful} registrations`, 'success');
                fetchImportHistory();
                setShowValidationModal(false);
                setUploadedFile(null);
            } else {
                showToast(result.error || 'Import failed', 'error');
            }
        } catch (err) {
            showToast('Import failed', 'error');
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = (type: 'CSV' | 'Excel') => {
        const headers = config.requiredColumns;
        const csvContent = headers.join(',') + '\n"Adi Seshu","22B91A0501","adi@example.com","9876543210","Hackathon 2025"';

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${config.templateName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`${type} template downloaded`, 'success');
    };

    const handleExport = async () => {
        setIsLoadingExport(true);
        try {
            const result = await getAllRegistrations(); // In production, this should accept filters
            if (!result.success) throw new Error(result.error);

            let data = result.data?.registrations || [];

            // Apply filtering logic here...
            // (Keeping it simple for now as per legacy code)

            // CSV Export
            exportRegistrationsToCSV(data as any, `export_${new Date().toISOString().split('T')[0]}.csv`);

            showToast('Export successful', 'success');
            fetchExportHistory();
        } catch (err: any) {
            showToast(err.message || 'Export failed', 'error');
        } finally {
            setIsLoadingExport(false);
        }
    };

    return (
        <div className="p-8 animate-page-entrance">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] mb-2">Bulk Import/Export</h1>
                        <p className="text-sm text-[#6B7280]">Import or export registration data in bulk</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="inline-flex items-center p-1 bg-[#F4F2F0] rounded-lg border border-[#E5E7EB]/50">
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`px-6 py-2 text-sm font-medium rounded-[7px] transition-all ${activeTab === 'import' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B7280]'
                            }`}
                    >
                        Import Data
                    </button>
                    <button
                        onClick={() => setActiveTab('export')}
                        className={`px-6 py-2 text-sm font-medium rounded-[7px] transition-all ${activeTab === 'export' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B7280]'
                            }`}
                    >
                        Export Data
                    </button>
                </div>
            </div>

            {activeTab === 'import' ? (
                <div className="space-y-6">
                    {/* Guidelines */}
                    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-semibold text-[#1E40AF] mb-2">Import Guidelines</h3>
                                <ul className="text-sm text-[#1E40AF] space-y-1 list-disc list-inside">
                                    {config.importGuidelines.map((g: any, i: any) => <li key={i}>{g}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Step 1 & 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#F4F2F0] rounded-[16px] p-2.5">
                            <h3 className="text-base font-semibold text-[#1A1A1A] mb-4 px-3 mt-2">Step 1: Download Template</h3>
                            <div className="bg-white rounded-[16px] p-5">
                                <p className="text-sm text-[#6B7280] mb-4">Ensure your data is formatted correctly</p>
                                <div className="flex gap-3">
                                    <button onClick={() => handleDownloadTemplate('CSV')} className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-[#F3F4F6]">
                                        <Download className="w-4 h-4" /> CSV
                                    </button>
                                    <button onClick={() => handleDownloadTemplate('Excel')} className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-[#F3F4F6]">
                                        <Download className="w-4 h-4" /> Excel
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#F4F2F0] rounded-[16px] p-2.5">
                            <h3 className="text-base font-semibold text-[#1A1A1A] mb-4 px-3 mt-2">Step 2: Upload File</h3>
                            <div className="bg-white rounded-[16px] p-5">
                                <label className="block cursor-pointer">
                                    <div className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-10 text-center hover:border-[#1A1A1A] transition-colors">
                                        <Upload className="w-8 h-8 text-[#6B7280] mx-auto mb-4" />
                                        <h4 className="text-sm font-semibold mb-1">Click to browse</h4>
                                        <p className="text-xs text-[#6B7280]">CSV, XLSX, XLS • Max 10MB</p>
                                    </div>
                                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv,.xlsx,.xls" title="Upload" />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Import History */}
                    <div className="bg-[#F4F2F0] rounded-[18px] p-2.5">
                        <div className="flex items-center justify-between mb-4 px-3 mt-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wide">Import History</h3>
                            <button onClick={fetchImportHistory} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-sm font-medium hover:bg-[#F9FAFB]">
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                            </button>
                        </div>
                        <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-[#F9FAFB] border-b text-[10px] uppercase text-[#9CA3AF]">
                                    <tr>
                                        <th className="px-6 py-3">Filename</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Records</th>
                                        <th className="px-6 py-3">Success</th>
                                        <th className="px-6 py-3">Failed</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {importHistory.map((item: any) => (
                                        <tr key={item.id} className="border-b last:border-0 hover:bg-[#FAFAFA]">
                                            <td className="px-6 py-4 font-medium flex items-center gap-2">
                                                <FileSpreadsheet className="w-4 h-4 text-[#6B7280]" /> {item.filename}
                                            </td>
                                            <td className="px-6 py-4 text-[#6B7280]">
                                                {isMounted ? new Date(item.importDate).toLocaleDateString() : ''}
                                            </td>
                                            <td className="px-6 py-4 font-semibold">{item.records}</td>
                                            <td className="px-6 py-4 font-semibold text-[#10B981]">{item.successful}</td>
                                            <td className="px-6 py-4 font-semibold text-[#EF4444]">{item.failed}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-[#ECFDF5] text-[#10B981] rounded-full text-xs font-semibold">Completed</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Export Settings */}
                    <div className="bg-[#F4F2F0] rounded-[18px] p-2.5">
                        <h3 className="text-base font-semibold px-3 mt-2 mb-4">Export Settings</h3>
                        <div className="bg-white rounded-[12px] p-6 grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Date Range</label>
                                <Select value={dateRange} onValueChange={setDateRange}>
                                    <SelectTrigger className="w-full h-[46px] border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                                    <SelectContent className="">
                                        <SelectItem value="All Time" className="">All Time</SelectItem>
                                        <SelectItem value="Last 7 Days" className="">Last 7 Days</SelectItem>
                                        <SelectItem value="Last 30 Days" className="">Last 30 Days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Event</label>
                                <Select value={eventFilter} onValueChange={setEventFilter}>
                                    <SelectTrigger className="w-full h-[46px] border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                                    <SelectContent className="">
                                        <SelectItem value="All Events" className="">All Events</SelectItem>
                                        {availableEvents.map(e => <SelectItem key={e.id} value={e.title} className="">{e.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Status</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full h-[46px] border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                                    <SelectContent className="">
                                        <SelectItem value="All Statuses" className="">All Statuses</SelectItem>
                                        <SelectItem value="Confirmed Only" className="">Confirmed Only</SelectItem>
                                        <SelectItem value="Pending Only" className="">Pending Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Format</label>
                                <Select value={fileFormat} onValueChange={setFileFormat}>
                                    <SelectTrigger className="w-full h-[46px] border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                                    <SelectContent className="">
                                        <SelectItem value="CSV (.csv)" className="">CSV</SelectItem>
                                        <SelectItem value="Excel (.xlsx)" className="">Excel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4 px-3">
                            <button
                                onClick={handleExport}
                                disabled={isLoadingExport}
                                className="px-6 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-sm font-semibold hover:bg-[#2D2D2D] transition-colors disabled:opacity-50"
                            >
                                {isLoadingExport ? 'Preparing...' : 'Generate Export'}
                            </button>
                        </div>
                    </div>

                    {/* Export History */}
                    <div className="bg-[#F4F2F0] rounded-[18px] p-2.5">
                        <h3 className="text-sm font-semibold uppercase tracking-wide px-3 mt-2 mb-4">Export History</h3>
                        <div className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-[#F9FAFB] border-b text-[10px] uppercase text-[#9CA3AF]">
                                    <tr>
                                        <th className="px-6 py-3">Filename</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Records</th>
                                        <th className="px-6 py-3">Type</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {exportHistory.map((item: any) => (
                                        <tr key={item.id} className="border-b last:border-0 hover:bg-[#FAFAFA]">
                                            <td className="px-6 py-4 font-medium flex items-center gap-2">
                                                <Download className="w-4 h-4 text-[#6B7280]" /> {item.name}
                                            </td>
                                            <td className="px-6 py-4 text-[#6B7280]">
                                                {isMounted ? new Date(item.createdAt).toLocaleDateString() : ''}
                                            </td>
                                            <td className="px-6 py-4 font-semibold">{item.size}</td>
                                            <td className="px-6 py-4 uppercase text-xs font-semibold">FILE</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => window.open(item.url, '_blank')}
                                                    className="text-[#3B82F6] hover:underline font-medium"
                                                >
                                                    Download
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Validation Modal */}
            <Modal
                isOpen={showValidationModal}
                onClose={() => !importing && setShowValidationModal(false)}
                title="File Import Validation"
                footer={null}
                onConfirm={() => { }}
                tooltipText=""
            >
                <div className="space-y-6">
                    {validationStatus === 'checking' && (
                        <div className="text-center py-8">
                            <RefreshCw className="w-12 h-12 text-[#3B82F6] animate-spin mx-auto mb-4" />
                            <p className="text-sm font-medium">Validating file structure...</p>
                        </div>
                    )}

                    {validationStatus === 'error' && (
                        <div className="space-y-4">
                            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4 flex items-start gap-3">
                                <X className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-[#991B1B]">Validation Failed</h4>
                                    <p className="text-xs text-[#991B1B]">Your file is missing required columns:</p>
                                    <ul className="mt-2 text-xs text-[#991B1B] list-disc list-inside">
                                        {validationErrors.map(err => <li key={err}>{err}</li>)}
                                    </ul>
                                </div>
                            </div>
                            <button onClick={() => setShowValidationModal(false)} className="w-full py-2.5 bg-[#F9FAFB] border rounded-lg text-sm font-medium">Close</button>
                        </div>
                    )}

                    {validationStatus === 'valid' && (
                        <div className="space-y-6">
                            <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg p-4 flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-[#065F46]">File Validated</h4>
                                    <p className="text-xs text-[#065F46]">Ready to import {parsedData.length} records from <strong>{uploadedFile?.name}</strong>.</p>
                                </div>
                            </div>

                            {importing ? (
                                <div className="space-y-2">
                                    <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#10B981] transition-all" style={{ width: `${importProgress}%` }} />
                                    </div>
                                    <p className="text-xs text-center text-[#6B7280]">Importing... {importProgress}%</p>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <button onClick={() => setShowValidationModal(false)} className="flex-1 py-2.5 bg-white border rounded-lg text-sm font-medium hover:bg-[#F9FAFB]">Cancel</button>
                                    <button onClick={handleImport} className="flex-1 py-2.5 bg-[#10B981] text-white rounded-lg text-sm font-semibold hover:bg-[#059669]">Start Import</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
