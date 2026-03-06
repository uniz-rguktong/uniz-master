import { Search, Download, Filter, Shield, AlertCircle, CheckCircle } from 'lucide-react';

const LOGS = [
    { id: 1, user: 'John Doe', action: 'Published Event', resource: 'Code Marathon (CSE)', time: '2 mins ago', ip: '192.168.1.5', status: 'Success' },
    { id: 2, user: 'Sarah Conn', action: 'Login Failed', resource: 'System Access', time: '15 mins ago', ip: '45.2.1.99', status: 'Failed' },
    { id: 3, user: 'Mike Ross', action: 'Approved Photo', resource: 'Gallery Upload #452', time: '1 hour ago', ip: '192.168.1.8', status: 'Success' },
    { id: 4, user: 'System', action: 'Auto-Backup', resource: 'Database', time: '4 hours ago', ip: 'localhost', status: 'Success' },
    { id: 5, user: 'Rachel Zane', action: 'Deleted User', resource: 'Temp User #99', time: 'Yesterday', ip: '192.168.1.12', status: 'Warning' },
];

export default function AccessLogsPage() {
    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
             <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">System Access Logs</h1>
                        <p className="text-sm text-[#6B7280]">Monitor system activity, security events, and administrative actions.</p>
                    </div>
                     <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                        <Download className="w-4 h-4" />
                        Export to CSV
                    </button>
                </div>
            </div>

             <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                 {/* Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-3 mt-2.5 mb-4">
                     <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" 
                        />
                     </div>
                     <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm hover:bg-gray-50">
                            <Filter className="w-4 h-4 text-gray-500" />
                            Filter
                        </button>
                     </div>
                </div>

                <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden shadow-sm">
                    <table className="w-full">
                         <thead className="bg-white border-b border-[#F3F4F6]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Action</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Resource</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">IP Address</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {LOGS.map((log: any) => (
                                <tr key={log.id} className="hover:bg-[#FAFAFA] transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                        {log.time}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                                                {log.user.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium text-[#1A1A1A]">{log.user}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#1A1A1A]">
                                        {log.status === 'Failed' && <span className="text-red-600 font-medium mr-2">!</span>}
                                        {log.action}
                                    </td>
                                     <td className="px-6 py-4 text-sm text-gray-500">
                                        {log.resource}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                        {log.ip}
                                    </td>
                                    <td className="px-6 py-4">
                                         {log.status === 'Success' && (
                                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                <CheckCircle className="w-3 h-3" />
                                                Success
                                             </span>
                                         )}
                                          {log.status === 'Failed' && (
                                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                                <Shield className="w-3 h-3" />
                                                Blocked
                                             </span>
                                         )}
                                          {log.status === 'Warning' && (
                                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                                                <AlertCircle className="w-3 h-3" />
                                                Warning
                                             </span>
                                         )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
