import { FileText, Download, Printer, Calendar } from 'lucide-react';

export default function FestSummaryReportPage() {
    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A]">Executive Fest Summary</h1>
                        <p className="text-sm text-[#6B7280]">Consolidated performance report for Ornate 2026.</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                            <Printer className="w-4 h-4" />
                            Print View
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors">
                            <Download className="w-4 h-4" />
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] shadow-sm p-8 max-w-[210mm] mx-auto min-h-[297mm]">
                {/* Header */}
                <div className="text-center border-b border-gray-200 pb-8 mb-8">
                    <h2 className="text-3xl font-black text-[#1A1A1A] mb-2 uppercase tracking-wide">Ornate 2026</h2>
                    <p className="text-gray-500 font-medium">Post-Event Analysis Report</p>
                    <div className="text-xs text-gray-400 mt-2">Generated on: Feb 12, 2026 • 14:00 PM</div>
                </div>

                {/* Key Highlights */}
                <div className="grid grid-cols-2 gap-8 mb-12">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Participation</h3>
                        <div className="text-4xl font-bold text-[#1A1A1A]">2,458</div>
                        <p className="text-sm text-gray-600 mt-1">Total registered students across all branches.</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Events Conducted</h3>
                        <div className="text-4xl font-bold text-[#1A1A1A]">42</div>
                        <p className="text-sm text-gray-600 mt-1">Activities successfully executed without cancellation.</p>
                    </div>
                </div>

                {/* detailed sections */}
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-bold text-[#1A1A1A] mb-4 border-l-4 border-indigo-500 pl-3">Financial Overview</h3>
                        <p className="text-sm text-gray-600 mb-4">The fest operated within the allocated budget with a surplus of 15% due to optimized sponsorship deals.</p>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-2 text-left">Category</th>
                                    <th className="p-2 text-right">Allocated</th>
                                    <th className="p-2 text-right">Spent</th>
                                    <th className="p-2 text-right">Variance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="p-2">Logistics</td>
                                    <td className="p-2 text-right">$5,000</td>
                                    <td className="p-2 text-right">$4,200</td>
                                    <td className="p-2 text-right text-green-600">+ $800</td>
                                </tr>
                                <tr>
                                    <td className="p-2">Marketing</td>
                                    <td className="p-2 text-right">$2,000</td>
                                    <td className="p-2 text-right">$1,950</td>
                                    <td className="p-2 text-right text-green-600">+ $50</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-[#1A1A1A] mb-4 border-l-4 border-purple-500 pl-3">Feedback Summary</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-[#1A1A1A]">4.5/5</div>
                                <div className="text-xs text-gray-500">Overall Satisfaction</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-[#1A1A1A]">92%</div>
                                <div className="text-xs text-gray-500">Would Recommend</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-[#1A1A1A]">Top</div>
                                <div className="text-xs text-gray-500">DJ Night (Event)</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
                    <p>Confidential Document • Ornate Event Management System</p>
                    <p>RGUKT Ongole</p>
                </div>
            </div>
        </div>
    );
}
