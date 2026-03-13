import { Database, Calendar, CheckSquare, Download } from 'lucide-react';

export default function ReportBuilderPage() {
    return (
        <div className="p-6 md:p-8 max-w-[1000px] mx-auto">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A]">Custom Report Builder</h1>
                        <p className="text-sm text-[#6B7280]">Generate specific datasets by querying the database.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Step 1: Data Source */}
                    <div className="bg-white rounded-[18px] p-6 border border-[#E5E7EB] shadow-sm">
                        <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">1</span>
                            Select Data Source
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {['Registrations', 'Events', 'Payments', 'Feedback', 'Volunteers', 'System Logs'].map((source: any) => (
                                <label key={source} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 has-checked:border-indigo-500 has-checked:bg-indigo-50">
                                    <input type="radio" name="source" className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm font-medium text-gray-700">{source}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Columns */}
                    <div className="bg-white rounded-[18px] p-6 border border-[#E5E7EB] shadow-sm">
                        <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">2</span>
                            Choose Columns to Export
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {['User ID', 'Full Name', 'Email Address', 'Phone Number', 'Branch', 'Year', 'Event ID', 'Payment Status', 'Registration Date', 'Check-in Time'].map((col: any) => (
                                <label key={col} className="flex items-center gap-2">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <span className="text-sm text-gray-600">{col}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Step 3: Action */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[18px] p-6 border border-[#E5E7EB] shadow-sm">
                        <h3 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">3</span>
                            Date Range
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">From</label>
                                <input type="date" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">To</label>
                                <input type="date" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 rounded-[18px] p-6 border border-indigo-100">
                        <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-transform active:scale-95">
                            <Download className="w-4 h-4" />
                            Generate Report
                        </button>
                        <p className="text-xs text-indigo-400 text-center mt-3">Estimated processing time: ~5s</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
